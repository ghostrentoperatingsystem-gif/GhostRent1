@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #f8f9fa;
  font-family: system-ui, -apple-system, sans-serif;
  color: #1a1a2e;
}

/* Safe area padding for notched phones */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Form elements */
input, textarea, select {
  @apply border border-line rounded-card px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-signal transition;
}

/* Buttons */
.btn-primary {
  @apply bg-signal text-white px-6 py-2 rounded-card hover:bg-signalDark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-paper text-ink px-6 py-2 rounded-card hover:bg-line transition border border-line;
}

.btn-danger {
  @apply bg-rust text-white px-6 py-2 rounded-card hover:bg-red-700 transition;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Property card animations */
.property-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.property-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}

/* Poll messaging styles */
.poll-option {
  transition: all 0.2s ease;
}

.poll-option:hover {
  transform: scale(1.02);
}

.poll-option:active {
  transform: scale(0.98);
}

/* Message bubbles */
.message-bubble {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Toast notifications */
.toast {
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile bottom nav */
.bottom-nav {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Image gallery */
.gallery-image {
  transition: opacity 0.3s ease;
}

.gallery-image:hover {
  opacity: 0.9;
}

/* Status badges */
.status-badge {
  @apply text-xs px-2 py-0.5 rounded-full;
}

.status-badge-approved {
  @apply bg-green-100 text-green-700;
}

.status-badge-pending {
  @apply bg-yellow-100 text-yellow-700;
}

.status-badge-draft {
  @apply bg-gray-100 text-gray-700;
}

.status-badge-rejected {
  @apply bg-red-100 text-red-700;
}

/* Utility classes */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Focus styles for accessibility */
*:focus-visible {
  @apply outline-none ring-2 ring-signal ring-offset-2;
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  /* Add dark mode styles if needed */
    }
