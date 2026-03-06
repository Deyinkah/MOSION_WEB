import "./globals.css";

export const metadata = {
  title: "Mosion | Watch cinema movies on your mobile device.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mosion"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0E0F"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0D0E0F" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#0D0E0F" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0D0E0F" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return;
  var iOSThemeColor = "#00C2FF";
  var metas = document.querySelectorAll('meta[name="theme-color"]');
  if (!metas.length) {
    var createdMeta = document.createElement("meta");
    createdMeta.name = "theme-color";
    document.head.appendChild(createdMeta);
    metas = [createdMeta];
  }
  metas.forEach(function (meta) {
    meta.setAttribute("content", iOSThemeColor);
  });
})();`
          }}
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mosion" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
