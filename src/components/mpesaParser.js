// src/components/mpesaParser.js
export function parseMpesaMessage(message) {
  const result = {
    code: null,
    type: null, // Send Money, Receive Money, Paybill, Buy Goods
    amount: 0,
    cost: 0,
    newBalance: 0,
    from: null,
    to: null,
    date: null
  };

  if (!message) return result;

  // 1️⃣ Transaction Code
  const codeMatch = message.match(/^([A-Z0-9]{10})/i);
  if (codeMatch) {
    result.code = codeMatch[1];
  }

  // 2️⃣ Main transaction amount only
  // Matches:
  // "Confirmed. Ksh1200.00"
  // "Confirmed. Ksh 1,200.00"
  // "Confirmed. KES1200.00"
  const amountMatch = message.match(
    /Confirmed\.\s*(?:Ksh|KES)\s?([\d,]+(?:\.\d{2})?)/i
  );

  if (amountMatch) {
    result.amount = Number(
      amountMatch[1].replace(/,/g, "")
    );
  }

  // 3️⃣ Transaction Cost
  const costMatch = message.match(
    /Transaction cost,\s*(?:Ksh|KES)\s?([\d,]+(?:\.\d{2})?)/i
  );

  if (costMatch) {
    result.cost = Number(
      costMatch[1].replace(/,/g, "")
    );
  }

  // 4️⃣ New M-PESA balance
  const balanceMatch = message.match(
    /New M-?PESA balance (?:is|:)\s*(?:Ksh|KES)\s?([\d,]+(?:\.\d{2})?)/i
  );

  if (balanceMatch) {
    result.newBalance = Number(
      balanceMatch[1].replace(/,/g, "")
    );
  }

  // 5️⃣ Send Money
  const sendMatch = message.match(
    /You (?:have )?sent (?:Ksh|KES)[\d,]+\.\d{2} to (.+?) (\d{9,12})/i
  );

  if (sendMatch) {
    result.type = "Send Money";
    result.to = `${sendMatch[1]} ${sendMatch[2]}`;
  }

  // 6️⃣ Receive Money
  const receiveMatch = message.match(
    /received from\s+(\d{9,15})\s*-\s*(.+?)\s+on/i
  );

  if (receiveMatch) {
    result.type = "Receive Money";
    result.from = `${receiveMatch[2]} ${receiveMatch[1]}`;
  }

  // 7️⃣ Paybill
  if (/paid to paybill/i.test(message)) {
    result.type = "Paybill";
  }

  // 8️⃣ Buy Goods
  if (/paid to buy goods/i.test(message)) {
    result.type = "Buy Goods";
  }

  // 9️⃣ Date and time
  const dateMatch = message.match(
    /on (\d{2}\/\d{2}\/\d{2,4}) at (\d{1,2}:\d{2}\s?(AM|PM))/i
  );

  if (dateMatch) {
    result.date = `${dateMatch[1]} ${dateMatch[2]}`;
  }

  // Debug log
  console.log("PARSED M-PESA:", result);

  return result;
}