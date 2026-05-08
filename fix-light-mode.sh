#!/bin/bash

# Fix light mode colors by replacing hardcoded patterns with CSS variable-based ones
# Run this from the frontend directory

echo "Fixing light mode color patterns..."

# Pattern 1: bg-slate-50 dark:bg-[#121212] -> bg-[var(--bg-page)] dark:bg-[var(--bg-page)]
# This is for page backgrounds
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-50 dark:bg-\[#121212\]/bg-[var(--bg-page)] dark:bg-[var(--bg-page)]/g' {} +

# Pattern 2: bg-white dark:bg-\[#[0-9A-Fa-f]*\] for cards -> bg-[var(--bg-card)]
# Only replace specific patterns that are clearly cards
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-white dark:bg-slate-800\/30/bg-[var(--bg-card)] dark:bg-[var(--bg-card)]/g' {} +

# Pattern 3: bg-slate-50 dark:bg-white/\[0\.02\] -> bg-[var(--bg-subtle)] dark:bg-white/[0.02]
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-50 dark:bg-white\/\[0\.02\]/bg-[var(--bg-subtle)] dark:bg-white\/[0.02]/g' {} +

# Pattern 4: bg-slate-50 dark:bg-white/\[0\.03\] -> bg-[var(--bg-subtle)] dark:bg-white/[0.03]
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-50 dark:bg-white\/\[0\.03\]/bg-[var(--bg-subtle)] dark:bg-white\/[0.03]/g' {} +

# Pattern 5: bg-slate-50 dark:bg-white/\[0\.04\] -> bg-[var(--bg-subtle)] dark:bg-white/[0.04]
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-50 dark:bg-white\/\[0\.04\]/bg-[var(--bg-subtle)] dark:bg-white\/[0.04]/g' {} +

# Pattern 6: bg-slate-100 dark:bg-white/\[0\.03\] -> bg-[var(--bg-subtle)] dark:bg-white/[0.03]
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-100 dark:bg-white\/\[0\.03\]/bg-[var(--bg-subtle)] dark:bg-white\/[0.03]/g' {} +

# Pattern 7: bg-slate-100 dark:bg-white/\[0\.05\] -> bg-[var(--bg-subtle)] dark:bg-white/[0.05]
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-100 dark:bg-white\/\[0\.05\]/bg-[var(--bg-subtle)] dark:bg-white\/[0.05]/g' {} +

# Pattern 8: text-slate-900 dark:text-white -> text-[var(--text-primary)] dark:text-[var(--text-primary)]
find src/app -name "*.tsx" -exec sed -i '' \
  's/text-slate-900 dark:text-white/text-[var(--text-primary)] dark:text-[var(--text-primary)]/g' {} +

# Pattern 9: text-slate-500 dark:text-slate-400 -> text-[var(--text-secondary)] dark:text-[var(--text-secondary)]
find src/app -name "*.tsx" -exec sed -i '' \
  's/text-slate-500 dark:text-slate-400/text-[var(--text-secondary)] dark:text-[var(--text-secondary)]/g' {} +

# Pattern 10: border-slate-200 dark:border-white/\[0\.06\] -> border-[var(--border)] dark:border-white/[0.06]
find src/app -name "*.tsx" -exec sed -i '' \
  's/border-slate-200 dark:border-white\/\[0\.06\]/border-[var(--border)] dark:border-white\/[0.06]/g' {} +

# Pattern 11: border-slate-200 dark:border-white/\[0\.07\] -> border-[var(--border)] dark:border-white/[0.07]
find src/app -name "*.tsx" -exec sed -i '' \
  's/border-slate-200 dark:border-white\/\[0\.07\]/border-[var(--border)] dark:border-white\/[0.07]/g' {} +

# Pattern 12: border-slate-200 dark:border-white/\[0\.08\] -> border-[var(--border)] dark:border-white/[0.08]
find src/app -name "*.tsx" -exec sed -i '' \
  's/border-slate-200 dark:border-white\/\[0\.08\]/border-[var(--border)] dark:border-white\/[0.08]/g' {} +

# Pattern 13: bg-slate-50 dark:bg-\[#121212\]/50 -> bg-[var(--bg-page)] dark:bg-[var(--bg-page)]/50
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-50 dark:bg-\[#121212\]\/50/bg-[var(--bg-page)] dark:bg-[var(--bg-page)]\/50/g' {} +

# Pattern 14: bg-slate-100 dark:bg-\[#[0-9A-Fa-f]*\] -> bg-[var(--bg-subtle)]
find src/app -name "*.tsx" -exec sed -i '' \
  's/bg-slate-100 dark:bg-\[#[0-9A-Fa-f]*\]/bg-[var(--bg-subtle)] dark:bg-[var(--bg-subtle)]/g' {} +

echo "Done!"
