import { Component, OnInit, OnDestroy, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommentService } from '../services/comment.service';
import { Comment } from '../models/comment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-comment',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './comment.component.html',
  // styleUrls: ['./comment.component.css'], // Fix typo from styleUrl to styleUrls
  encapsulation: ViewEncapsulation.None
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input() productId!: number;
  comments: Comment[] = [];
  showReviewForm: boolean = false;
  reviewForm: FormGroup;
  private commentsSubscription!: Subscription;

  constructor(
    private readonly commentService: CommentService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly as: AuthService,
    private readonly router: Router
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, Validators.required],
      comment: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    if (this.productId) {
      this.loadComments(); // Load comments when productId is available
      
      // Subscribe to the comments observable after productId is set
      this.commentsSubscription = this.commentService.comments$.subscribe(comments => {
        console.log('Comments from service:', comments); // Log all comments
        this.comments = this.commentService.getCommentsByProductId(this.productId);
        console.log('Filtered comments:', this.comments); // Log filtered comments
      });
    }
  }

  loadComments(): void {
    this.comments = this.commentService.getCommentsByProductId(this.productId);
  }

  openReviewForm() {
    if (this.as.getAuthState()) {
      this.showReviewForm = true;
    } else {
      this.router.navigate(['/login']);
    }
  }

  onStarClick(star: number): void {
    this.reviewForm.get('rating')?.setValue(star); // Update the rating in the form
  }

  submitForm() {
    const isAuthenticated = this.as.getAuthState(); // Check if the user is authenticated
    if (isAuthenticated) {
      const newComment: Comment = {
        id: this.comments.length + 1, // Handle ID generation properly if needed
        productId: this.productId,
        userName: this.as.currentUserSig()!.userName, // Get the username from your AuthService
        comment: this.reviewForm.get('comment')?.value,
        rating: this.reviewForm.get('rating')?.value,
        createdAt: new Date() // Use the current date
      };

      this.commentService.addComment(newComment); // Use the method to add the comment
      this.reviewForm.reset(); // Reset the form after submission
      this.showReviewForm = false; // Optionally hide the review form
    } else {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
    }
  }

  ngOnDestroy(): void {
    if (this.commentsSubscription) {
      this.commentsSubscription.unsubscribe();
    }
  }
}