import { message } from "antd";
import * as XLSX from "xlsx";

const getExportFormattedDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Utility Xuất file Excel chuẩn .xlsx (SheetJS)
 * Mở trực tiếp bằng Microsoft Excel, hiển thị chuẩn từng cột A, B, C, D...
 * Tự động căn chỉnh độ rộng cột và định dạng dữ liệu
 */
export const exportToExcelCSV = (filename, columnDefs, data, summaryRow = null) => {
  try {
    const dateStr = getExportFormattedDate();
    let cleanName = filename.replace(/^MenuGo_/i, "");
    const finalFilename = `MenuGo_${cleanName}_${dateStr}`;

    const headers = columnDefs.map((col) => col.title || "");
    const aoa = [headers];

    if (summaryRow && Array.isArray(summaryRow)) {
      const summary = summaryRow.map((val) => (val === null || val === undefined ? "-" : val));
      aoa.push(summary);
    }

    (data || []).forEach((row) => {
      const rowData = columnDefs.map((col) => {
        let val = typeof col.field === "function" ? col.field(row) : row[col.field];
        if (val === null || val === undefined) return "-";
        return val;
      });
      aoa.push(rowData);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Tính toán độ rộng cột tự động
    const colWidths = columnDefs.map((col, idx) => {
      let maxLen = (col.title || "").toString().length;
      if (summaryRow && summaryRow[idx]) {
        maxLen = Math.max(maxLen, String(summaryRow[idx]).length);
      }
      for (let r = 0; r < Math.min((data || []).length, 100); r++) {
        const row = data[r];
        let val = typeof col.field === "function" ? col.field(row) : row[col.field];
        if (val !== null && val !== undefined) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
    });
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");
    XLSX.writeFile(wb, `${finalFilename}.xlsx`);

    message.success(`Đã xuất file Excel: ${finalFilename}.xlsx`);
  } catch (err) {
    console.error("Lỗi xuất file Excel:", err);
    message.error("Không thể xuất file. Vui lòng thử lại!");
  }
};

/**
 * Utility Xuất nhiều bảng tổng hợp chung 1 file Excel (.xlsx)
 */
export const exportMultipleTablesToExcel = (filename, tablesArray) => {
  try {
    const dateStr = getExportFormattedDate();
    let cleanName = filename.replace(/^MenuGo_/i, "");
    const finalFilename = `MenuGo_${cleanName}_${dateStr}`;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng hợp tất cả các bảng
    const combinedAoa = [];
    let maxColsCount = 0;

    tablesArray.forEach((tbl) => {
      if (tbl.title) {
        combinedAoa.push([`=== ${tbl.title.toUpperCase()} ===`]);
      }
      const headers = tbl.columnDefs.map((col) => col.title || "");
      maxColsCount = Math.max(maxColsCount, headers.length);
      combinedAoa.push(headers);

      (tbl.data || []).forEach((row) => {
        const rowData = tbl.columnDefs.map((col) => {
          let val = typeof col.field === "function" ? col.field(row) : row[col.field];
          if (val === null || val === undefined) return "-";
          return val;
        });
        combinedAoa.push(rowData);
      });

      combinedAoa.push([]);
    });

    const combinedWs = XLSX.utils.aoa_to_sheet(combinedAoa);
    combinedWs["!cols"] = Array(maxColsCount).fill({ wch: 22 });
    XLSX.utils.book_append_sheet(wb, combinedWs, "Tổng hợp");

    // Thêm từng Sheet riêng cho mỗi bảng để xem chi tiết
    tablesArray.forEach((tbl, idx) => {
      const headers = tbl.columnDefs.map((col) => col.title || "");
      const sheetAoa = [headers];

      (tbl.data || []).forEach((row) => {
        const rowData = tbl.columnDefs.map((col) => {
          let val = typeof col.field === "function" ? col.field(row) : row[col.field];
          if (val === null || val === undefined) return "-";
          return val;
        });
        sheetAoa.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetAoa);
      const colWidths = tbl.columnDefs.map((col) => {
        let maxLen = (col.title || "").toString().length;
        for (let r = 0; r < Math.min((tbl.data || []).length, 100); r++) {
          const row = tbl.data[r];
          let val = typeof col.field === "function" ? col.field(row) : row[col.field];
          if (val !== null && val !== undefined) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        }
        return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
      });
      ws["!cols"] = colWidths;

      let sheetName = (tbl.title || `Bảng ${idx + 1}`)
        .replace(/[:\\/?*\[\]]/g, "")
        .trim()
        .slice(0, 31);
      if (!sheetName) sheetName = `Bảng ${idx + 1}`;

      // Đảm bảo tên sheet không trùng lặp
      if (wb.SheetNames.includes(sheetName)) {
        sheetName = `${sheetName.slice(0, 28)}_${idx + 1}`;
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `${finalFilename}.xlsx`);
    message.success(`Đã xuất file Excel: ${finalFilename}.xlsx`);
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
