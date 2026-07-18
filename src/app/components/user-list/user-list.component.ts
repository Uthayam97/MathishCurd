import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

/** Tracks sort direction per column */
type SortDirection = 'asc' | 'desc' | 'none';

interface SortState {
  column: string;
  direction: SortDirection;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {

  // ── Data ────────────────────────────────────────────────
  allUsers: User[] = [];          // raw data from API
  filteredUsers: User[] = [];     // after search + sort
  paginatedUsers: User[] = [];    // current page slice

  // ── Loading / Error state ───────────────────────────────
  isLoading = false;
  errorMessage = '';

  // ── Search ──────────────────────────────────────────────
  searchTerm = '';

  // ── Sort ────────────────────────────────────────────────
  sortState: SortState = { column: '', direction: 'none' };

  // ── Pagination ──────────────────────────────────────────
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  // ── Modal state ─────────────────────────────────────────
  showModal = false;
  selectedUser: User | null = null;
  isSaving = false;

  // ── Delete confirmation ─────────────────────────────────
  showDeleteConfirm = false;
  userToDelete: User | null = null;

  /** Unsubscribe trigger for RxJS subscriptions */
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════
  //  DATA LOADING
  // ══════════════════════════════════════════════════════════

  /** Fetch all users from JSON Server */
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allUsers = data;
          this.applySearchAndSort();
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Failed to load users. Please try again.';
          this.isLoading = false;
          console.error('Error loading users:', err);
        }
      });
  }

  // ══════════════════════════════════════════════════════════
  //  SEARCH
  // ══════════════════════════════════════════════════════════

  /** Filter users by partial, case-insensitive match across multiple fields */
  onSearch(): void {
    this.currentPage = 1;
    this.applySearchAndSort();
  }

  /** Clear search and reset */
  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applySearchAndSort();
  }

  /** Apply current search term + sort to produce filteredUsers, then paginate */
  private applySearchAndSort(): void {
    let result = [...this.allUsers];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.contact.toLowerCase().includes(term) ||
        user.address.toLowerCase().includes(term)
      );
    }

    // Sort
    if (this.sortState.direction !== 'none' && this.sortState.column) {
      result.sort((a, b) => {
        const valA = (a as unknown as Record<string, unknown>)[this.sortState.column] ?? '';
        const valB = (b as unknown as Record<string, unknown>)[this.sortState.column] ?? '';

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          comparison = Number(valA) - Number(valB);
        }

        return this.sortState.direction === 'asc' ? comparison : -comparison;
      });
    }

    this.filteredUsers = result;
    this.paginate();
  }

  // ══════════════════════════════════════════════════════════
  //  SORTING
  // ══════════════════════════════════════════════════════════

  /** Three-state toggle: none → asc → desc → none */
  toggleSort(column: string): void {
    if (this.sortState.column === column) {
      // Cycle through: none → asc → desc → none
      if (this.sortState.direction === 'none') {
        this.sortState = { column, direction: 'asc' };
      } else if (this.sortState.direction === 'asc') {
        this.sortState = { column, direction: 'desc' };
      } else {
        this.sortState = { column: '', direction: 'none' };
      }
    } else {
      this.sortState = { column, direction: 'asc' };
    }

    this.applySearchAndSort();
  }

  /** Returns the appropriate icon class for a given column */
  getSortIcon(column: string): string {
    if (this.sortState.column !== column || this.sortState.direction === 'none') {
      return 'bi-arrow-down-up text-muted';
    }
    return this.sortState.direction === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  // ══════════════════════════════════════════════════════════
  //  PAGINATION
  // ══════════════════════════════════════════════════════════

  /** Slice filteredUsers for the current page */
  private paginate(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  /** Total number of pages */
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  /** Page numbers to render (with ellipsis logic) */
  get pageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    // Pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    // Always show last page
    pages.push(total);

    return pages;
  }

  /** Navigate to a specific page */
  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginate();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginate();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginate();
    }
  }

  /** Change page size and reset to page 1 */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.paginate();
  }

  /** "Showing X to Y of Z entries" text */
  get showingText(): string {
    const total = this.filteredUsers.length;
    if (total === 0) return 'No entries found';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);
    return `Showing ${start} to ${end} of ${total} entries`;
  }

  // ══════════════════════════════════════════════════════════
  //  ADD / EDIT MODAL
  // ══════════════════════════════════════════════════════════

  /** Open the modal in "Add" mode */
  openAddModal(): void {
    this.selectedUser = null;
    this.showModal = true;
    this.openBootstrapModal();
  }

  /** Open the modal in "Edit" mode with the user's current data */
  openEditModal(user: User): void {
    this.selectedUser = { ...user };
    this.showModal = true;
    this.openBootstrapModal();
  }

  /** Programmatically show Bootstrap modal */
  private openBootstrapModal(): void {
    // Allow Angular to render the modal DOM first
    setTimeout(() => {
      const modalEl = document.getElementById('userModal');
      if (modalEl) {
        const bootstrap = (window as unknown as Record<string, unknown>)['bootstrap'] as { modal: new (el: HTMLElement, opts?: Record<string, unknown>) => { show: () => void; hide: () => void } };
        if (bootstrap && bootstrap.modal) {
          const bsModal = new bootstrap.modal(modalEl, { backdrop: 'static', keyboard: false });
          bsModal.show();

          // When Bootstrap hides the modal, also reset our state
          modalEl.addEventListener('hidden.bs.modal', () => {
            this.showModal = false;
            this.selectedUser = null;
          });
        } else {
          // Fallback: just show the modal via class
          modalEl.classList.add('show');
          modalEl.style.display = 'block';
          document.body.classList.add('modal-open');
        }
      }
    }, 100);
  }

  /** Programmatically hide Bootstrap modal */
  hideBootstrapModal(): void {
    const modalEl = document.getElementById('userModal');
    if (modalEl) {
      const bootstrap = (window as unknown as Record<string, unknown>)['bootstrap'] as { modal: new (el: HTMLElement) => { hide: () => void } };
      if (bootstrap && bootstrap.modal) {
        const bsModal = new bootstrap.modal(modalEl);
        bsModal.hide();
      } else {
        modalEl.classList.remove('show');
        modalEl.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
    }
    this.showModal = false;
    this.selectedUser = null;
  }

  /** Handle save event from modal (add or update) */
  onSaveUser(user: User): void {
    this.isSaving = true;

    if (user.id) {
      // UPDATE
      this.userService.updateUser(user.id, user)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.hideBootstrapModal();
            this.loadUsers();
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Error updating user:', err);
            alert('Failed to update user. Please try again.');
          }
        });
    } else {
      // CREATE
      this.userService.addUser(user)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSaving = false;
            this.hideBootstrapModal();
            this.loadUsers();
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Error adding user:', err);
            alert('Failed to add user. Please try again.');
          }
        });
    }
  }

  // ══════════════════════════════════════════════════════════
// DELETE
// ══════════════════════════════════════════════════════════

deleteUser(user: User): void {
  if (!user.id) return;

  const confirmed = confirm(`Are you sure you want to delete "${user.name}"?`);

  if (!confirmed) {
    return;
  }

  this.userService.deleteUser(user.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        alert('User deleted successfully!');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        alert('Failed to delete user. Please try again.');
      }
    });
}
}
