import type { SwitchCaseResponseType } from '../api.js';
import type { Endpoints } from '../api.types.js';

declare module '../api.js' {
  export interface APIClient {
    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:abuse-report:notification-recipient*
     */
    request<E extends 'admin/abuse-report/notification-recipient/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:abuse-user-reports*
     */
    request<E extends 'admin/abuse-user-reports', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'admin/accounts/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:account*
     */
    request<E extends 'admin/accounts/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:account*
     */
    request<E extends 'admin/accounts/find-by-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:ad*
     */
    request<E extends 'admin/ad/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:ad*
     */
    request<E extends 'admin/ad/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:ad*
     */
    request<E extends 'admin/ad/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:ad*
     */
    request<E extends 'admin/ad/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:announcements*
     */
    request<E extends 'admin/announcements/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:announcements*
     */
    request<E extends 'admin/announcements/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:announcements*
     */
    request<E extends 'admin/announcements/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:announcements*
     */
    request<E extends 'admin/announcements/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:avatar-decorations*
     */
    request<E extends 'admin/avatar-decorations/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:avatar-decorations*
     */
    request<E extends 'admin/avatar-decorations/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:avatar-decorations*
     */
    request<E extends 'admin/avatar-decorations/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:avatar-decorations*
     */
    request<E extends 'admin/avatar-decorations/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:meta*
     */
    request<E extends 'admin/captcha/current', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'admin/captcha/save', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:delete-account*
     */
    request<E extends 'admin/delete-account', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:delete-all-files-of-a-user*
     */
    request<E extends 'admin/delete-all-files-of-a-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:drive*
     */
    request<E extends 'admin/drive/clean-remote-files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:drive*
     */
    request<E extends 'admin/drive/cleanup', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:drive*
     */
    request<E extends 'admin/drive/files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:drive*
     */
    request<E extends 'admin/drive/show-file', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/add', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/add-aliases-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/copy', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/delete-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'admin/emoji/import-zip', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:emoji*
     */
    request<E extends 'admin/emoji/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:emoji*
     */
    request<E extends 'admin/emoji/list-remote', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/remove-aliases-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/set-aliases-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/set-category-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/set-license-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:emoji*
     */
    request<E extends 'admin/emoji/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/delete-all-files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/refresh-remote-instance-metadata', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/remove-all-following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:federation*
     */
    request<E extends 'admin/federation/update-instance', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
     */
    request<E extends 'admin/forward-abuse-user-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:index-stats*
     */
    request<E extends 'admin/get-index-stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:table-stats*
     */
    request<E extends 'admin/get-table-stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:user-ips*
     */
    request<E extends 'admin/get-user-ips', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:invite-codes*
     */
    request<E extends 'admin/invite/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:invite-codes*
     */
    request<E extends 'admin/invite/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:meta*
     */
    request<E extends 'admin/meta', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:promo*
     */
    request<E extends 'admin/promo/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/clear', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/deliver-delayed', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/inbox-delayed', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/jobs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/pause', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/promote-jobs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/queue-stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/queues', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/remove-job', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/resume', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:queue*
     */
    request<E extends 'admin/queue/retry-job', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/show-job', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/show-job-logs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:queue*
     */
    request<E extends 'admin/queue/stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:relays*
     */
    request<E extends 'admin/relays/add', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:relays*
     */
    request<E extends 'admin/relays/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:relays*
     */
    request<E extends 'admin/relays/remove', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:reset-password*
     */
    request<E extends 'admin/reset-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
     */
    request<E extends 'admin/resolve-abuse-user-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/assign', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:roles*
     */
    request<E extends 'admin/roles/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:roles*
     */
    request<E extends 'admin/roles/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/unassign', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:roles*
     */
    request<E extends 'admin/roles/update-default-policies', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:admin:roles*
     */
    request<E extends 'admin/roles/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:send-email*
     */
    request<E extends 'admin/send-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:server-info*
     */
    request<E extends 'admin/server-info', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:show-moderation-log*
     */
    request<E extends 'admin/show-moderation-logs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:show-user*
     */
    request<E extends 'admin/show-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:show-user*
     */
    request<E extends 'admin/show-users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:suspend-user*
     */
    request<E extends 'admin/suspend-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/test', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *write:admin:system-webhook*
     */
    request<E extends 'admin/system-webhook/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:unset-mfa*
     */
    request<E extends 'admin/unset-mfa', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:unset-user-avatar*
     */
    request<E extends 'admin/unset-user-avatar', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:unset-user-banner*
     */
    request<E extends 'admin/unset-user-banner', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:unsuspend-user*
     */
    request<E extends 'admin/unsuspend-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:resolve-abuse-user-report*
     */
    request<E extends 'admin/update-abuse-user-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'admin/update-meta', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:account*
     */
    request<E extends 'admin/update-proxy-account', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:user-note*
     */
    request<E extends 'admin/update-user-note', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'announcements', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'announcements/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'antennas/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'antennas/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'antennas/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'antennas/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'antennas/remove-note', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'antennas/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'antennas/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:federation*
     */
    request<E extends 'ap/get', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'ap/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'app/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'app/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'auth/accept', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'auth/session/generate', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'auth/session/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'auth/session/userkey', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:blocks*
     */
    request<E extends 'blocking/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:blocks*
     */
    request<E extends 'blocking/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:blocks*
     */
    request<E extends 'blocking/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'bubble-game/ranking', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'bubble-game/register', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/favorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'channels/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/follow', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/followed', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/mute/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/mute/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/mute/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/my-favorites', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:channels*
     */
    request<E extends 'channels/owned', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'channels/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'channels/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'channels/timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/unfavorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/unfollow', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:channels*
     */
    request<E extends 'channels/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/active-users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/ap-request', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/drive', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/federation', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/instance', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/user/drive', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/user/following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/user/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/user/pv', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/user/reactions', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'charts/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/history', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/create-to-room', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/create-to-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/react', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/room-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/messages/unreact', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/messages/user-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/read-all', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/invitations/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/invitations/ignore', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/invitations/inbox', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/invitations/outbox', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/join', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/joining', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/leave', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/members', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/mute', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/owned', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:chat*
     */
    request<E extends 'chat/rooms/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:chat*
     */
    request<E extends 'chat/rooms/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'clips/add-note', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'clips/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'clips/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:clip-favorite*
     */
    request<E extends 'clips/favorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'clips/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:clip-favorite*
     */
    request<E extends 'clips/my-favorites', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:account*
     */
    request<E extends 'clips/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'clips/remove-note', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:account*
     */
    request<E extends 'clips/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:clip-favorite*
     */
    request<E extends 'clips/unfavorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'clips/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/attached-chat-messages', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Find the notes to which the given file is attached.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/attached-notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Check if a given file exists.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/check-existence', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Upload a new drive file.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Delete an existing drive file.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for a drive file by the given parameters.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/find', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for a drive file by a hash of the contents.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/find-by-hash', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/move-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show the properties of a drive file.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/files/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Update the properties of a drive file.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Request the server to download a new drive file from the specified URL.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/files/upload-from-url', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/folders', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/folders/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/folders/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/folders/find', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/folders/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:drive*
     */
    request<E extends 'drive/folders/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:drive*
     */
    request<E extends 'drive/stream', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'email-address/available', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'emoji', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'emojis', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'endpoint', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'endpoints', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'export-custom-emojis', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'federation/followers', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'federation/following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'federation/instances', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'federation/show-instance', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'federation/stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'federation/update-remote-user', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'federation/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'fetch-external-resources', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'fetch-rss', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:flash*
     */
    request<E extends 'flash/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:flash*
     */
    request<E extends 'flash/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'flash/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:flash-likes*
     */
    request<E extends 'flash/like', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:flash*
     */
    request<E extends 'flash/my', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:flash-likes*
     */
    request<E extends 'flash/my-likes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'flash/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'flash/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:flash-likes*
     */
    request<E extends 'flash/unlike', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:flash*
     */
    request<E extends 'flash/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/invalidate', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * List of following users
     * 
     * **Credential required**: *Yes* / **Permission**: *read:following*
     */
    request<E extends 'following/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/requests/accept', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/requests/cancel', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:following*
     */
    request<E extends 'following/requests/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/requests/reject', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:following*
     */
    request<E extends 'following/requests/sent', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:following*
     */
    request<E extends 'following/update-all', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'gallery/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'gallery/popular', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'gallery/posts', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:gallery*
     */
    request<E extends 'gallery/posts/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:gallery*
     */
    request<E extends 'gallery/posts/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:gallery-likes*
     */
    request<E extends 'gallery/posts/like', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'gallery/posts/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:gallery-likes*
     */
    request<E extends 'gallery/posts/unlike', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:gallery*
     */
    request<E extends 'gallery/posts/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'get-avatar-decorations', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'get-online-users-count', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'hashtags/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'hashtags/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'hashtags/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'hashtags/trend', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'hashtags/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/done', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/key-done', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/password-less', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/register', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/register-key', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/remove-key', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/unregister', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/2fa/update-key', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/apps', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/authorized-apps', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/change-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/claim-achievement', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/delete-account', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-antennas', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-blocking', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-clips', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-favorites', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-mute', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/export-user-lists', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:favorites*
     */
    request<E extends 'i/favorites', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:gallery-likes*
     */
    request<E extends 'i/gallery/likes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:gallery*
     */
    request<E extends 'i/gallery/posts', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-antennas', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-blocking', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-muting', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/import-user-lists', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/move', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:notifications*
     */
    request<E extends 'i/notifications', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:notifications*
     */
    request<E extends 'i/notifications-grouped', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:page-likes*
     */
    request<E extends 'i/page-likes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:pages*
     */
    request<E extends 'i/pages', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/pin', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/read-announcement', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/regenerate-token', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/registry/get', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/registry/get-all', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/registry/get-detail', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/registry/keys', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/registry/keys-with-type', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/registry/remove', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/registry/scopes-with-domain', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/registry/set', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Revoke an access token of the authenticated user. Requires credential. When called with an access token (third-party app), only the token currently in use can be revoked.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'i/revoke-token', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/signin-history', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/unpin', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'i/update-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/webhooks/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/webhooks/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/webhooks/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/webhooks/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'i/webhooks/test', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'i/webhooks/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:invite-codes*
     */
    request<E extends 'invite/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:invite-codes*
     */
    request<E extends 'invite/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:invite-codes*
     */
    request<E extends 'invite/limit', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:invite-codes*
     */
    request<E extends 'invite/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Vibes stability report: for each of the last `days` days (Beijing time, today first), how many page loads there were, how many failed to start and why, and how long starting and the first content took (see src/misc/lojo-boot-report.ts).
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:meta*
     */
    request<E extends 'lojo/admin/boot-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Polish what the user wants to tell their own coding agent into natural English, with short notes in Chinese.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/agent/english', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Restructure what the user wants their own coding agent to do into a clearer English prompt, with notes in Chinese.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/agent/prompt', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Vibes: an anonymous record of how fast the app started on this device, sent once per page load without the account (see src/misc/lojo-boot-report.ts). Stored per day for the stability report.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/boot-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Vibes: an anonymous record of how the live connection held up while a page was open, sent without the account when the page goes to the background or is closed (see src/misc/lojo-boot-report.ts, ConnReport). Kept only where LOJO_SPEED_FIELDS=on.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/conn-report', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Write the copy for one of your plans for a note (创作讲解), from your own idea, story, standard and tone, then check it once more against the note. Saved as a draft in your registry (scope lojo/create). Takes about 20 s.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/create/copy', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Replace what 创作讲解 works from: the formats (形式卡) Vibes took apart from viral posts, and the local accounts whose notes anyone may use besides their own. Sent by apps/community/scripts/create-import.mjs in the Vibes workspace; the formats are kept out of the public source.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'lojo/create/import', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Marketing plans for a note (创作讲解), made by the formats Vibes took apart from viral posts. Kept for a week per person and note; refresh makes new ones. Takes about 25 s.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/create/plans', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Whether 创作讲解 works here, how many formats it knows, and whose notes it may use besides your own.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/create/status', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Turn a draft (Chinese or English) into three English versions: casual, slang and formal.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/english/compose', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Translate a note (or a chat message's text) and explain the expressions worth learning.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/english/explain', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Suggest three English replies to a note.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/english/reply-ideas', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Read a note (or a short English text such as an example sentence) aloud and return the audio URL.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/english/speech', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/english/status', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:account*
     */
    request<E extends 'lojo/entities/import', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/entities/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/entities/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Counts one visitor step of 先玩后注册 for today (Beijing): only the day, the step and where the visitor came from. No account, IP or device is kept.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/funnel', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Replace the question sets of a route map with gates. Sent by apps/community/scripts/gates-import.mjs in the Vibes workspace, which checks them first; the sets hold the answers, so they are kept out of the public source. The vocabulary and grammar questions are marked against their own answers and tests first: if any of them fails, nothing is imported and the error lists them.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'lojo/gates/import', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 同路人: the people who tried a gate in the last 30 days, the latest first (up to `limit`), and how many in all. Leaves out you, people you block or mute or who block you, bots, suspended accounts, people who are not discoverable or hide their online status, and profiles under 18.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/gates/peers', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Start a line's placement test: without `after` its first part; with the handed-in first part (`after`), the harder or easier second part it leads to. Hand each part in with lojo/gates/submit.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/gates/placement', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Every station of a route map with gates (IELTS), and which ones you have passed, can take on or have to wait for.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/gates/progress', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Start a gate: pick a question set you have not heard yet and return the paper and its recording (no answers); a spell question comes with the recording of its word. The first start of a set can take half a minute while the recording is made.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/gates/start', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Hand in a gate and get it marked. Handing in the same attempt again returns the first result.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/gates/submit', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:page-likes*
     */
    request<E extends 'lojo/guides/bookmark', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notes*
     */
    request<E extends 'lojo/guides/comments/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notes*
     */
    request<E extends 'lojo/guides/comments/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:pages*
     */
    request<E extends 'lojo/guides/comments/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'lojo/guides/feature', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:pages*
     */
    request<E extends 'lojo/guides/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'lojo/guides/save', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:pages*
     */
    request<E extends 'lojo/guides/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:reactions*
     */
    request<E extends 'lojo/guides/threads/like', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:pages*
     */
    request<E extends 'lojo/guides/threads/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notes*
     */
    request<E extends 'lojo/notes/link', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/notes/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Answers the next question of a try: an option key (choice, TFNG), the words typed (gap) or the chips joined by spaces (build). The server judges it and takes a heart for a wrong answer. When the try ends, end has the result, XP, the chest, the streak and the review.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/answer', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 「问 Mia」 on a failed try: the server builds what happened (wrong questions, hearts, streak, where to go next) and the tutor writes first in DM. Once per try; result is sent, already, limit or off.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/ask-tutor', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * The recording of the current question of a try, made by the server voices. lines has one url per speaker line, played at rate; without speech it is empty and fallback has the script to show as text, except for a gap question (the script would give the answer away): that question is swapped for another one of the level, skip.next, with nothing judged and no heart taken (skip.next is null when the level has none left).
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/quest/audio', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * This week's XP board. It opens only when at least 5 real learners have XP this week; nobody is made up.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/quest/board', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 锦囊补心: the 3-question check of a book in the bookshop. 2 right passes: the book goes in the bag, Boss prep and the streak tick, and 1 heart comes back if below 5 and the 锦囊 path has not given one today. Once a day per book.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/check', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Opened the 情报站 (timeline posts): ticks Boss prep. Never gives a heart.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/news', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 闯关定级: closes the banner on the map for good (the menu entry stays). Returns the same as lojo/quest/show.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/placement-dismiss', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 闯关定级: hands in the second part (5 answers). Lights the levels before the suggested one (1 star, 0 XP), gives 20 XP and counts today. Returns the suggestion and the same as lojo/quest/show under quest.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/placement-finish', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 闯关定级: hands in the first part (5 answers). Returns the second part, chosen by how the first went.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/placement-first', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 闯关定级: the test paper (the first part, or the second when the first was kept from a test quit later), whether a test can be taken now (once in 30 days) and the last result.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/quest/placement-paper', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * A practice app finished one set. It counts with at least 10 items and 2 minutes, once a day per setKey: Boss prep and the streak tick, and 1 heart comes back if below 5 and the 装备 path has not given one today (语法线 gives none in v1). 生词本 sets are checked against its saved reviews.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/refill', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Sets the exam date (YYYY-MM-DD, after today and within two years; null clears it) and whether the first-time walkthrough is done. Returns the same as lojo/quest/show.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/settings', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Everything the 闯关 page needs: hearts (refilled at 08:00 and 20:00 Beijing), streak, XP, Boss prep, today's 补心, the chapter map with each node's state and the bookshop. Answers are not included.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/quest/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Starts a try at a level, the Boss, or a retest of a faded level (retest: 3 questions, no hearts). Levels give their two sets in turn, then a mix. Wrong answers cost a heart, except in practice levels and retests.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/start', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Puts a book from the bookshop in the bag (3 at most) to carry into a level. Counts as the guide for Boss prep; gives no heart.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/take', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * The clock of a timed try (第四章 4-6 and the Boss) reached 0 on the page. The server checks the time from when the try started; when it is up, the questions not answered count as wrong (time-out) and the try ends. Otherwise it says how many seconds are left.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/time-up', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Answers the next question of a visitor’s try; the same as answer, without hearts. At the end, end shows the result as it will be once the visitor saves.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/quest/trial-answer', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * The recording of the current question of a visitor’s try; the same as audio.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/quest/trial-audio', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 存档: right after signing up, the passed try the visitor played (trialId) is moved onto this account. Returns the same as show.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/quest/trial-claim', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * A visitor’s 闯关 map (先玩后注册): the same as show for a new learner, with the first level passed once the visitor’s try (trialId) was passed. Nothing is stored.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/quest/trial-show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * A visitor starts the first level without an account. attemptId is the trial id, kept a few hours; the same as start otherwise.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/quest/trial-start', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/state/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/state/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * The AI tutor accounts, so chats with them can be marked as AI.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'lojo/tutor/ids', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Mastra pilot (test site only): Mia's fixed prompt, the progress card, keyword search of the learner's chat with Mia, their wordbook and the mistakes of a quest level.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:meta*
     */
    request<E extends 'lojo/tutor/pilot-tool', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Have the AI tutor write first to a learner now, skipping the daily schedule (for trying it out).
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'lojo/tutor/poke', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Have the AI tutor write first about a failed quest try, as after "Ask Mia" (for trying quest mode out with a sample try).
     * 
     * **Credential required**: *Yes* / **Permission**: *write:admin:meta*
     */
    request<E extends 'lojo/tutor/quest-poke', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Saves a word to your 生词本 with its two review cards, unless you have it already (then created is false).
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/words/add', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Moves words saved before the 生词本 had reviews (in the account registry) into it. Words you already have are skipped; the rest keep the time they were saved.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/words/import', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * 生词本: every word you saved, the newest first, with its two review cards (认得 and 拼写).
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/words/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Removes a word from your 生词本, with its cards and their reviews.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/words/remove', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Records one review of a 生词本 card and schedules it with FSRS. rating: 1 忘了 (again), 2 hard, 3 记得 (good), 4 easy. Send the card's reps as shown: if they no longer match, the review was already saved (a retry, another tab) and the card is returned unchanged with applied false. tzOffset (Date#getTimezoneOffset()) makes FSRS count days by the learner's midnight.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'lojo/words/review', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Today's 生词本 reviews: the cards up now in order (due ones, then new words up to today's allowance), each with when it would come back after each answer, and the counts for the page. tzOffset is the client's Date#getTimezoneOffset(), so the day ends at the learner's midnight.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'lojo/words/today', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'meta', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'miauth/gen-token', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:mutes*
     */
    request<E extends 'mute/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:mutes*
     */
    request<E extends 'mute/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:mutes*
     */
    request<E extends 'mute/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'my/apps', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/children', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/clips', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/conversation', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notes*
     */
    request<E extends 'notes/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notes*
     */
    request<E extends 'notes/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/drafts/count', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'notes/drafts/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'notes/drafts/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/drafts/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'notes/drafts/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:favorites*
     */
    request<E extends 'notes/favorites/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:favorites*
     */
    request<E extends 'notes/favorites/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/global-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/hybrid-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/local-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/mentions', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/polls/recommendation', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:votes*
     */
    request<E extends 'notes/polls/vote', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/reactions', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:reactions*
     */
    request<E extends 'notes/reactions/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:reactions*
     */
    request<E extends 'notes/reactions/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/renotes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/replies', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/search-by-tag', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'notes/show-partial-bulk', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/state', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'notes/thread-muting/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'notes/thread-muting/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/translate', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notes*
     */
    request<E extends 'notes/unrenote', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'notes/user-list-timeline', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notifications*
     */
    request<E extends 'notifications/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notifications*
     */
    request<E extends 'notifications/flush', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notifications*
     */
    request<E extends 'notifications/mark-all-as-read', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:notifications*
     */
    request<E extends 'notifications/test-notification', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'page-push', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'pages/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'pages/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'pages/featured', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:page-likes*
     */
    request<E extends 'pages/like', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'pages/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:page-likes*
     */
    request<E extends 'pages/unlike', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:pages*
     */
    request<E extends 'pages/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'ping', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'pinned-users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'promo/read', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:mutes*
     */
    request<E extends 'renote-mute/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:mutes*
     */
    request<E extends 'renote-mute/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:mutes*
     */
    request<E extends 'renote-mute/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Request a users password to be reset.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'request-reset-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Only available when running with <code>NODE_ENV=testing</code>. Reset the database and flush Redis.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'reset-db', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Complete the password reset that was previously requested.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'reset-password', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'retention', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'reversi/cancel-match', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'reversi/games', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'reversi/invitations', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'reversi/match', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'reversi/show-game', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'reversi/surrender', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'reversi/verify', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'roles/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'roles/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'roles/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'roles/users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'server-info', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'stats', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Register to receive push notifications.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'sw/register', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Check push notification registration exists.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'sw/show-registration', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Unregister from receiving push notifications.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'sw/unregister', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Update push notification registration.
     * 
     * **Internal Endpoint**: This endpoint is an API for the misskey mainframe and is not intended for use by third parties.
     * **Credential required**: *Yes*
     */
    request<E extends 'sw/update-registration', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Endpoint for testing input validation.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'test', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'username/available', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/achievements', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all clips this user owns.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/clips', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/featured-notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all flashs this user created.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/flashs', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show everyone that follows this user.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/followers', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show everyone that this user is following.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/following', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all gallery posts by the given user.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/gallery/posts', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Retrieve users who have a birthday on the specified range.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'users/get-following-users-by-birthday', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Get a list of other users that the specified user frequently replies to.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/get-frequently-replied-users', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Create a new list of users.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/create', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/create-from-public', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Delete an existing list of users.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/delete', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/favorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No* / **Permission**: *read:account*
     */
    request<E extends 'users/lists/get-memberships', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all lists that the authenticated user has created.
     * 
     * **Credential required**: *No* / **Permission**: *read:account*
     */
    request<E extends 'users/lists/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Remove a user from a list.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/pull', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Add a user to an existing list.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/push', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show the properties of a list.
     * 
     * **Credential required**: *No* / **Permission**: *read:account*
     */
    request<E extends 'users/lists/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/unfavorite', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Update the properties of a list.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/update', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/lists/update-membership', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/notes', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all pages this user created.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/pages', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show all reactions this user made.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/reactions', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show users that the authenticated user might be interested to follow.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'users/recommendation', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show the different kinds of relations between the authenticated user and the specified user(s).
     * 
     * **Credential required**: *Yes* / **Permission**: *read:account*
     */
    request<E extends 'users/relation', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * File a report.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:report-abuse*
     */
    request<E extends 'users/report-abuse', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for users.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/search', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Search for a user by username and/or host.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/search-by-username-and-host', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * Show the properties of a user.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'users/show', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *write:account*
     */
    request<E extends 'users/update-memo', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *Yes* / **Permission**: *read:admin:emoji*
     */
    request<E extends 'v2/admin/emoji/list', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;

    /**
     * No description provided.
     * 
     * **Credential required**: *No*
     */
    request<E extends 'verify-email', P extends Endpoints[E]['req']>(
      endpoint: E,
      params: P,
      credential?: string | null,
    ): Promise<SwitchCaseResponseType<E, P>>;
  }
}
