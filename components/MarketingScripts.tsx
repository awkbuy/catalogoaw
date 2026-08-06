import Script from "next/script";
import {
  getMarketingConfig,
  MARKETING_DEFAULT_GA_ID,
  toClientConfig,
} from "@/lib/marketing/settings";

export default async function MarketingScripts() {
  const config = await getMarketingConfig();
  const gaId = config.ga4MeasurementId || MARKETING_DEFAULT_GA_ID;
  const clientConfig = toClientConfig(config);

  return (
    <>
      <Script id="marketing-config" strategy="afterInteractive">
        {`window.__WR_MARKETING__=${JSON.stringify(clientConfig)};`}
      </Script>

      {config.ga4Enabled && gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {config.metaPixelEnabled && config.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${config.metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {config.clarityEnabled && config.clarityProjectId && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${config.clarityProjectId}");
          `}
        </Script>
      )}
    </>
  );
}
