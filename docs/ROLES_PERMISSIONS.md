# Roles and permissions

Roles live in `src/domain/permissions.ts` and are enforced on the server for routes and APIs. Hiding a link is not the control.

Seeded people:

- Shahzeb, Super Admin, UK, all five Pages
- Masho, Content Operator, UK, all five Pages

Future roles already named in the matrix: Admin, Content Manager, Designer, Video Editor, Affiliate Manager, Analyst.

A content operator can see assigned work and submit it. A content operator cannot see finance, postback secrets, user admin, other private staff records or Super Admin settings. Opening an owner URL as Masho is redirected, and the finance, staff and Mandala APIs return 403.

Nobody can approve their own work, including a Super Admin who is also the assignee.

Shahzeb's account can open company progress, the Mandala, the calendar, approvals, brand bibles, the import report, training completion, staff admin, integration status and the empty finance area.
