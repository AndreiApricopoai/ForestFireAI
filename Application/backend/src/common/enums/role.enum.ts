/**
 * The three roles a user can have in the system.
 *
 * user   — regular user, can view dashboards and camera feeds
 * admin  — can manage cameras, start/stop workers, view all data
 * worker — service account used by the Python processing worker
 */
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  WORKER = 'worker',
}
