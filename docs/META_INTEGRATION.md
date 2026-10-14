# Meta integration

NOT CONNECTED.

Use the official Pages and Insights APIs for Pages the business administers. Ad Library access is a different product. Do not scrape private endpoints or bypass Meta security.

Permissions such as pages_show_list, pages_read_engagement and read_insights must be confirmed against current Meta documentation before the app is submitted. None are granted.

Start with one Page. Store Page id, post id, content id, URL, timestamps, metric snapshots, source, definition and errors. Tokens stay server-side, encrypted when a production secret store exists, and never logged.

Meta retired older reach and impression metrics in 2026. A metric registry must mark deprecated names. Unavailable values stay null. Total views are not unique reach.

A labelled manual export is the fallback if API access is blocked.
