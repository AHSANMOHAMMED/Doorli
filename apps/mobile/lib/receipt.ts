import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export type Receipt = {
  orderId: string;
  orderNumber: string;
  businessName: string;
  address?: string;
  phone?: string | null;
  customerName: string;
  paymentMethod: string;
  paidAt: string;
  items: Array<{
    name: string;
    barcode?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  total: number;
  note?: string | null;
};

function receiptHtml(r: Receipt): string {
  const rows = r.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee">${i.name}${
            i.barcode ? `<br/><small style="color:#888">${i.barcode}</small>` : ''
          }</td>
          <td style="text-align:center;padding:6px 0;border-bottom:1px solid #eee">${i.quantity}</td>
          <td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee">${i.unitPrice}</td>
          <td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee">${i.totalPrice}</td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${r.orderNumber}</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;padding:16px;max-width:360px;margin:0 auto;color:#111">
  <h1 style="font-size:18px;margin:0 0 4px">${r.businessName}</h1>
  <p style="margin:0;color:#666;font-size:12px">${r.address || ''}${r.phone ? ` · ${r.phone}` : ''}</p>
  <p style="margin:12px 0 4px;font-size:13px"><strong>${r.orderNumber}</strong></p>
  <p style="margin:0;font-size:12px;color:#666">${new Date(r.paidAt).toLocaleString()} · ${r.paymentMethod}</p>
  <p style="margin:4px 0 12px;font-size:12px">Customer: ${r.customerName}</p>
  <table style="width:100%;font-size:13px;border-collapse:collapse">
    <thead>
      <tr style="text-align:left;color:#888;font-size:11px">
        <th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Amt</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="text-align:right;font-size:18px;font-weight:800;margin-top:16px">TOTAL LKR ${Number(r.total).toLocaleString()}</p>
  ${r.note ? `<p style="font-size:12px;color:#666">Note: ${r.note}</p>` : ''}
  <p style="text-align:center;font-size:11px;color:#aaa;margin-top:24px">Thank you · Doorli POS</p>
</body></html>`;
}

/** Print via system printer dialog, or share PDF / text if no printer */
export async function printReceipt(receipt: Receipt) {
  const html = receiptHtml(receipt);
  try {
    if (Platform.OS === 'web') {
      // Web: open print dialog from a blob window
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
      }
      return;
    }

    await Print.printAsync({ html });
  } catch {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Bill ${receipt.orderNumber}`,
        });
      } else {
        const text = [
          receipt.businessName,
          receipt.orderNumber,
          ...receipt.items.map((i) => `${i.quantity}x ${i.name} @ ${i.unitPrice}`),
          `TOTAL LKR ${receipt.total}`,
        ].join('\n');
        await Share.share({ message: text, title: receipt.orderNumber });
      }
    } catch (e) {
      const text = [
        receipt.businessName,
        receipt.orderNumber,
        ...receipt.items.map((i) => `${i.quantity}x ${i.name} @ ${i.unitPrice}`),
        `TOTAL LKR ${receipt.total}`,
      ].join('\n');
      await Share.share({ message: text, title: receipt.orderNumber });
    }
  }
}
