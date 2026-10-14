# Roles and permissions

Roles live in `src/domain/permissions.ts` and are enforced on the server. Hiding a navigation item is not the control.

Shahzeb is Super Admin. Only that role can invite an operator, assign Pages, open finance, change the plan, and approve content.

`PUBLISHING_OPERATOR` is the role for every publishing operator. The permissions are view assigned work and submit work. The older `CONTENT_OPERATOR` value has the same two capabilities so an existing row does not gain or lose access. New invitations create `PUBLISHING_OPERATOR` only.

There is no staff-manager role. Operators do not see each other's name, email, assignments, tasks, or training. The owner does.

A publishing operator who opens an owner URL is redirected. Finance, staff, Mandala, assignments of other people, and campaign start return 403.

Nobody can approve their own work. The assignee compared at approval time is the content row in the database, not a value sent by the browser.

Page access for an operator is the current `page_assignments` rows. The catalog field `assignee_id` is historical and is not an authorization check.

Named future roles remain in the matrix and are not assigned by the invitation screen: Admin, Content Manager, Designer, Video Editor, Affiliate Manager, Analyst.
