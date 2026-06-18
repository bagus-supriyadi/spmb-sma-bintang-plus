import { Applicant, SPMBSettings } from "../types";

export interface SyncResult {
  success: boolean;
  message: string;
  driveFileUrl?: string;
  sheetsUrl?: string;
}

/**
 * Syncs the applicant database to the user's specific Google Sheet.
 * If the tab "Data Pendaftar" does not exist in the spreadsheet, it will be automatically created.
 */
export async function syncToGoogleSheets(
  accessToken: string,
  applicants: Applicant[],
  spreadsheetId: string
): Promise<SyncResult> {
  const sheetTitle = "Data Pendaftar";
  
  try {
    // 1. Check if "Data Pendaftar" sheet exists inside the spreadsheet
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!metaRes.ok) {
      if (metaRes.status === 401 || metaRes.status === 403) {
        throw new Error("Token autentikasi Google Anda telah kedaluwarsa atau akses ditolak (401/403). Silakan klik tombol 'Hubungkan Google Admin' kembali di bawah untuk memperbarui sesi koneksi Anda.");
      }
      const errText = await metaRes.text();
      console.error("Sheets metadata fetched failed:", errText);
      throw new Error(`Gagal membuka Spreadsheet. Pastikan ID Spreadsheet benar dan Anda memiliki akses tulis.`);
    }

    const metaData = await metaRes.json();
    const sheetsList = metaData.sheets || [];
    const hasTargetSheet = sheetsList.some(
      (s: any) => s.properties && s.properties.title === sheetTitle
    );

    // 2. If the tab does not exist, create it via batchUpdate
    if (!hasTargetSheet) {
      const createRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetTitle,
                    gridProperties: {
                      rowCount: 2000,
                      columnCount: 20,
                    },
                  },
                },
              },
            ],
          }),
        }
      );

      if (!createRes.ok) {
        throw new Error("Gagal membuat sheet tab 'Data Pendaftar' baru di spreadsheet.");
      }
    }

    // 3. Clear existing values from the sheet tab
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1:T2000:clear`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 4. Prepare data rows
    const headers = [
      "No",
      "ID Pendaftaran",
      "Waktu Registrasi",
      "Nama Lengkap",
      "NIK",
      "NISN",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Jenis Kelamin",
      "No. HP Siswa",
      "Nama Orang Tua/Wali",
      "No. HP Orang Tua",
      "Email",
      "Alamat Tinggal",
      "Asal Sekolah",
      "Pilihan Jurusan",
      "Status Seleksi",
      "Jarak Domisili ke Sekolah (m)",
      "Alasan Penolakan / Catatan"
    ];

    const rows = applicants.map((app, index) => [
      String(index + 1),
      app.id || "-",
      app.timestamp || "-",
      app.fullName || "-",
      `'${app.nik || ""}`, // Prefix with single quote to force as text string in Google Sheets
      `'${app.nisn || ""}`,
      app.birthPlace || "-",
      app.birthDate || "-",
      app.gender || "-",
      app.phone || "-",
      app.parentName || "-",
      app.parentPhone || "-",
      app.email || "-",
      app.address || "-",
      app.previousSchool || "-",
      app.preferredMajor || "-",
      app.status || "-",
      app.distance ? String(app.distance) : "-",
      app.rejectionReason || "-"
    ]);

    const values = [headers, ...rows];

    // 5. Write the values to Google Sheets
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1:S${values.length}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range: `${sheetTitle}!A1:S${values.length}`,
          majorDimension: "ROWS",
          values: values,
        }),
      }
    );

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error("Sheets update values failed:", errText);
      throw new Error("Gagal menulis data ke Google Sheets.");
    }

    return {
      success: true,
      message: `Berhasil mengekspor ${applicants.length} data pendaftar ke Google Sheet 'Data Pendaftar'.`,
      sheetsUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`
    };
  } catch (error: any) {
    console.error("syncToGoogleSheets Error:", error);
    return {
      success: false,
      message: error.message || "Gagal menyelaraskan data pendaftar."
    };
  }
}

/**
 * Uploads a JSON backup of the current application data to specified Google Drive folder.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  applicants: Applicant[],
  settings: SPMBSettings,
  folderId: string
): Promise<SyncResult> {
  try {
    const filename = `Backup_Database_SPMB_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
    const payload = {
      exportedAt: new Date().toISOString(),
      school: settings.schoolName,
      totalApplicants: applicants.length,
      settings: settings,
      applicants: applicants
    };

    const boundary = "314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: filename,
      mimeType: "application/json",
      parents: [folderId]
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(payload, null, 2) +
      close_delimiter;

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    );

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Token autentikasi Google Anda telah kedaluwarsa atau akses ditolak (401/403). Silakan klik tombol 'Hubungkan Google Admin' kembali di bawah untuk memperbarui sesi koneksi Anda.");
      }
      const errText = await res.text();
      console.error("Drive upload failed:", errText);
      throw new Error(`Gagal mengunggah cadangan data ke Google Drive: ${res.statusText}`);
    }

    const driveData = await res.json();
    const fileId = driveData.id;

    return {
      success: true,
      message: `Berhasil mengunggah file cadangan '${filename}' ke Google Drive.`,
      driveFileUrl: `https://drive.google.com/file/d/${fileId}/view`
    };
  } catch (error: any) {
    console.error("uploadBackupToDrive Error:", error);
    return {
      success: false,
      message: error.message || "Gagal mengunggah cadangan ke Google Drive."
    };
  }
}
