import { message } from "antd";

const getExportFormattedDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Utility Xuất file Excel chuẩn Unicode UTF-16LE (.csv)
 * Mở trực tiếp bằng Microsoft Excel KHÔNG CÓ BẤT KỲ CẢNH BÁO AN TOÀN (File format and extension don't match)
 * Tiếng Việt hiển thị 100% sắc nét, tự động tách thành từng cột A, B, C, D...
 * Tên file tự động cấu trúc: MenuGo_[TenBaoCao]_[NgayXuat].csv
 */
export const exportToExcelCSV = (filename, columnDefs, data, summaryRow = null) => {
  try {
    const dateStr = getExportFormattedDate();
    let cleanName = filename.replace(/^MenuGo_/i, "");
    const finalFilename = `MenuGo_${cleanName}_${dateStr}`;

    const delimiter = "\t";

    // 1. Dòng tiêu đề các cột
    const headers = columnDefs.map((col) => col.title).join(delimiter);

    // 2. Dòng tổng cộng (nếu có)
    const summary = summaryRow
      ? summaryRow.map((val) => String(val || "-").replace(/[\t\r\n]+/g, " ")).join(delimiter)
      : null;

    // 3. Các dòng dữ liệu
    const rows = data.map((row) => {
      return columnDefs
        .map((col) => {
          let val = typeof col.field === "function" ? col.field(row) : row[col.field];
          if (val === null || val === undefined) val = "-";
          return String(val).replace(/[\t\r\n]+/g, " ");
        })
        .join(delimiter);
    });

    const lines = [headers];
    if (summary) lines.push(summary);
    lines.push(...rows);

    const textContent = lines.join("\r\n");

    // Chuyển sang UTF-16LE ArrayBuffer chuẩn Microsoft Excel Unicode Text (BOM 0xFEFF)
    const buffer = new ArrayBuffer(2 + textContent.length * 2);
    const view = new DataView(buffer);

    // Byte Order Mark (Little Endian 0xFEFF)
    view.setUint16(0, 0xFEFF, true);

    for (let i = 0; i < textContent.length; i++) {
      view.setUint16(2 + i * 2, textContent.charCodeAt(i), true);
    }

    const blob = new Blob([buffer], { type: "text/csv;charset=utf-16le;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${finalFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`Đã xuất file Excel an toàn: ${finalFilename}.csv`);
  } catch (err) {
    console.error("Lỗi xuất file Excel:", err);
    message.error("Không thể xuất file. Vui lòng thử lại!");
  }
};

/**
 * Utility Xuất nhiều bảng tổng hợp chung 1 file Excel (.csv UTF-16LE)
 */
export const exportMultipleTablesToExcel = (filename, tablesArray) => {
  try {
    const dateStr = getExportFormattedDate();
    let cleanName = filename.replace(/^MenuGo_/i, "");
    const finalFilename = `MenuGo_${cleanName}_${dateStr}`;
    const delimiter = "\t";

    const allLines = [];

    tablesArray.forEach((tbl) => {
      if (tbl.title) {
        allLines.push(`=== ${tbl.title.toUpperCase()} ===`);
      }
      const headers = tbl.columnDefs.map((col) => col.title).join(delimiter);
      allLines.push(headers);

      tbl.data.forEach((row) => {
        const line = tbl.columnDefs
          .map((col) => {
            let val = typeof col.field === "function" ? col.field(row) : row[col.field];
            if (val === null || val === undefined) val = "-";
            return String(val).replace(/[\t\r\n]+/g, " ");
          })
          .join(delimiter);
        allLines.push(line);
      });

      allLines.push("");
      allLines.push("");
    });

    const textContent = allLines.join("\r\n");

    const buffer = new ArrayBuffer(2 + textContent.length * 2);
    const view = new DataView(buffer);
    view.setUint16(0, 0xFEFF, true);

    for (let i = 0; i < textContent.length; i++) {
      view.setUint16(2 + i * 2, textContent.charCodeAt(i), true);
    }

    const blob = new Blob([buffer], { type: "text/csv;charset=utf-16le;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${finalFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`Đã xuất file Excel tổng hợp: ${finalFilename}.csv`);
  } catch (err) {
    console.error("Lỗi xuất Excel tổng hợp:", err);
    message.error("Không thể xuất file. Vui lòng thử lại!");
  }
};

/**
 * Utility Mở cửa sổ In xem trước (Browser Native Print Dialog)
 */
export const printReportTable = (reportTitle, columnDefs, data, summaryRow = null) => {
  try {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      message.error("Vui lòng cho phép bật cửa sổ bật lên (popup) trên trình duyệt để in!");
      return;
    }

    const dateStr = getExportFormattedDate();
    const todayStr = new Date().toLocaleDateString("vi-VN");
    const docTitle = `MenuGo_${reportTitle.replace(/[\/\s]+/g, "_")}_${dateStr}`;

    const headerHtml = columnDefs
      .map(
        (col) =>
          `<th style="padding: 8px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 700; text-align: ${
            col.align || "left"
          }">${col.title}</th>`
      )
      .join("");

    const summaryHtml = summaryRow
      ? `<tr style="background: #fff7ed; font-weight: 700; border-top: 2px solid #ea580c;">
          ${columnDefs
            .map((col, idx) => {
              const val = summaryRow[idx] || "-";
              return `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: ${
                col.align || "left"
              }">${val}</td>`;
            })
            .join("")}
        </tr>`
      : "";

    const rowsHtml = data
      .map(
        (row) =>
          `<tr>
            ${columnDefs
              .map((col) => {
                let val = typeof col.field === "function" ? col.field(row) : row[col.field];
                if (val === null || val === undefined) val = "-";
                return `<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: ${
                  col.align || "left"
                }">${val}</td>`;
              })
              .join("")}
          </tr>`
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>

          <style>
            @media print {
              @page {
                size: A4 landscape;
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                font-family: Arial, Roboto, sans-serif;
              }
            }
            body {
              font-family: Arial, Roboto, sans-serif;
              color: #0f172a;
              padding: 20px;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .brand-title {
              font-size: 24px;
              font-weight: 800;
              color: #e8442a;
            }
            .report-title {
              font-size: 20px;
              font-weight: 700;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 13px;
            }
            .footer-sign {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              text-align: center;
            }
            .sign-box {
              width: 200px;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <div class="brand-title">MenuGo Restaurant</div>
              <div class="report-title">${reportTitle}</div>
            </div>
            <div style="text-align: right; font-size: 13px; color: #64748b;">
              <div>Ngày in: <strong>${todayStr}</strong></div>
              <div>Hệ thống quản lý MenuGo</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>${headerHtml}</tr>
            </thead>
            <tbody>
              ${summaryHtml}
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-sign">
            <div class="sign-box">
              <strong>Người lập báo cáo</strong><br/>
              <span style="font-size: 12px; color: #64748b;">(Ký & ghi rõ họ tên)</span>
            </div>
            <div class="sign-box">
              <strong>Quản lý chi nhánh</strong><br/>
              <span style="font-size: 12px; color: #64748b;">(Ký & ghi rõ họ tên)</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error("Lỗi khi mở cửa sổ in:", err);
    message.error("Không thể mở cửa sổ xem trước máy in!");
  }
};

/**
 * Utility In chung nhiều Bảng Tổng hợp vào 1 trang in / PDF
 */
export const printMultipleReportTables = (reportTitle, tablesArray) => {
  try {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      message.error("Vui lòng cho phép bật cửa sổ bật lên (popup) trên trình duyệt để in!");
      return;
    }

    const dateStr = getExportFormattedDate();
    const todayStr = new Date().toLocaleDateString("vi-VN");
    const docTitle = `MenuGo_${reportTitle.replace(/[\/\s]+/g, "_")}_${dateStr}`;

    const tablesHtml = tablesArray
      .map((tbl) => {
        const headerHtml = tbl.columnDefs
          .map(
            (col) =>
              `<th style="padding: 8px 10px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 700; text-align: ${
                col.align || "left"
              }">${col.title}</th>`
          )
          .join("");

        const rowsHtml = tbl.data
          .map(
            (row) =>
              `<tr>
                ${tbl.columnDefs
                  .map((col) => {
                    let val = typeof col.field === "function" ? col.field(row) : row[col.field];
                    if (val === null || val === undefined) val = "-";
                    return `<td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: ${
                      col.align || "left"
                    }">${val}</td>`;
                  })
                  .join("")}
              </tr>`
          )
          .join("");

        return `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 8px; border-left: 4px solid #ea580c; padding-left: 8px;">
              ${tbl.title}
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead><tr>${headerHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            @media print {
              @page { size: A4 landscape; margin: 15mm; }
              body { -webkit-print-color-adjust: exact; font-family: Arial, Roboto, sans-serif; }
            }
            body { font-family: Arial, Roboto, sans-serif; color: #0f172a; padding: 20px; }
            .header-info {
              display: flex; justify-content: space-between; align-items: flex-end;
              border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;
            }
            .brand-title { font-size: 24px; font-weight: 800; color: #e8442a; }
            .report-title { font-size: 20px; font-weight: 700; margin-top: 4px; }
            .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
            .sign-box { width: 200px; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <div class="brand-title">MenuGo Restaurant</div>
              <div class="report-title">${reportTitle}</div>
            </div>
            <div style="text-align: right; font-size: 13px; color: #64748b;">
              <div>Ngày in: <strong>${todayStr}</strong></div>
              <div>Hệ thống quản lý MenuGo</div>
            </div>
          </div>

          ${tablesHtml}

          <div class="footer-sign">
            <div class="sign-box">
              <strong>Người lập báo cáo</strong><br/>
              <span style="font-size: 12px; color: #64748b;">(Ký & ghi rõ họ tên)</span>
            </div>
            <div class="sign-box">
              <strong>Quản lý chi nhánh</strong><br/>
              <span style="font-size: 12px; color: #64748b;">(Ký & ghi rõ họ tên)</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (err) {
    console.error("Lỗi khi in tổng hợp:", err);
    message.error("Không thể mở cửa sổ xem trước máy in!");
  }
};
