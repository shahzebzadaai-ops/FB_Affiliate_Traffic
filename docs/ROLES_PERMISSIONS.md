# Roles and permissions

Phase 1 roles are data and a permission matrix in `src/domain/permissions.ts`. They are not enforced on a server, because there is no login yet.

Seeded people:

- Shahzeb, Super Admin, UK, all five Pages
- Masho, Content Operator, UK, all five Pages

Future roles already named in the matrix: Admin, Content Manager, Designer, Video Editor, Affiliate Manager, Analyst.

A content operator can see assigned work and submit it. A content operator cannot see finance, postback secrets, user admin, other private staff records or Super Admin settings. The staff navigation does not include those screens. Opening an owner URL while previewing as Masho returns him to his own area. That redirect is a preview behaviour, not security.

Nobody can approve their own work, including a Super Admin who is also the assignee.

Shahzeb's preview can open company progress, the calendar, approvals, brand bibles, the import report, training completion, integration status and the empty finance area.
