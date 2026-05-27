import Link from "next/link";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.82 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.26 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-stone-200/70 bg-white/60 backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-stone-600 dark:text-stone-400 sm:px-6 lg:px-8">
        <p>
          Wood Wiz · Cape Town firewood prices per kg · Not affiliated with any vendor
        </p>
        <div className="flex items-center gap-4">
          <Link href="/faq" className="hover:text-amber-700 dark:hover:text-amber-400">
            How it works
          </Link>
          <a
            href="https://github.com/ces0491/wood-wiz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-400"
          >
            <GithubMark className="size-3.5" />
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
