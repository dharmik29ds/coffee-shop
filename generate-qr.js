// generate-qr.js
// Generates a scannable QR code (PNG) that points customers straight to
// the /order page. Run once (or whenever your URL changes) with:
//   npm run generate-qr
//
// By default it points at http://localhost:3000/order which only works
// on devices on the same machine/network as the server. For real customers
// scanning with their phones, replace TARGET_URL below with your public
// domain or ngrok URL, e.g. "https://mycafe.com/order".

const QRCode = require("qrcode");
const path = require("path");

const TARGET_URL = process.env.TARGET_URL || "https://coffee-shop-alh8.onrender.com/order";
const OUTPUT_PATH = path.join(__dirname, "public", "qr-code.png");

QRCode.toFile(
  OUTPUT_PATH,
  TARGET_URL,
  {
    width: 500,
    margin: 2,
    color: {
      dark: "#3e2723",
      light: "#ffffff"
    }
  },
  (err) => {
    if (err) {
      console.error("Failed to generate QR code:", err);
      process.exit(1);
    }
    console.log(`✅ QR code generated for: ${TARGET_URL}`);
    console.log(`   Saved to: ${OUTPUT_PATH}`);
    console.log(`   Print this and place it on your tables!`);
  }
);
