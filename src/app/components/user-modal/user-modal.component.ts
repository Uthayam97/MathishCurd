import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../models/user';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.css']
})
export class UserModalComponent implements OnChanges {

  /** The user being edited (null for add mode) */
  @Input() user: User | null = null;

  /** True while a save request is in-flight */
  @Input() isSaving = false;

  /** Fired when the user clicks Save with a valid form */
  @Output() save = new EventEmitter<User>();

  /** Fired when the modal is dismissed/closed */
  @Output() close = new EventEmitter<void>();

  userForm!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  /** Re-patch form whenever the input user changes (add vs edit) */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.userForm) {
      this.patchForm();
    }
  }

  /** Whether we are in "Edit" mode */
  get isEditMode(): boolean {
    return this.user !== null && this.user.id !== undefined;
  }

  /** Human-readable modal title */
  get modalTitle(): string {
    return this.isEditMode ? 'Edit User' : 'Add User';
  }

  /** Initialize the reactive form with validators */
  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z\\s]+$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      contact: ['', [
        Validators.required,
        Validators.pattern('^99\\d{8}$')
      ]],
      address: ['', [
        Validators.required
      ]]
    });
  }

  /** Patch form values when editing an existing user */
  private patchForm(): void {
    if (this.user) {
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        contact: this.user.contact,
        address: this.user.address
      });
    } else {
      this.userForm.reset({ name: '', email: '', contact: '', address: '' });
    }
  }

  /** Submit handler – emits the user payload to the parent */
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload: User = {
      ...this.userForm.value
    };

    // Preserve the id when editing
    if (this.isEditMode && this.user) {
      payload.id = this.user.id;
    }

    this.save.emit(payload);
  }

  /** Close the modal without saving */
  onClose(): void {
    this.close.emit();
  }

  /** Convenience getters for template validation */
  get f() {
    return this.userForm.controls;
  }
}
