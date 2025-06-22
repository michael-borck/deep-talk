---
layout: default
title: DeepTalk
description: AI-powered conversation analysis and insight discovery platform
---

<section class="py-20 sm:py-24 lg:py-32">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 dark:text-white tracking-tight">DeepTalk</h1>
        <div class="mt-6 prose-styles max-w-3xl mx-auto">
            <p>AI-powered conversation analysis and insight discovery platform with local processing and privacy-first design.</p>
        </div>
        <div class="mt-10 flex flex-wrap flex-col sm:flex-row justify-center items-center gap-4">
            <a href="#features" class="inline-block rounded-lg bg-sky-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors">Get Started</a>
            <a href="{{ '/docs/' | relative_url }}" class="inline-flex items-center justify-center bg-white dark:bg-stone-700 px-6 py-3 text-base font-semibold text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-inset ring-stone-300 dark:ring-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors rounded-lg">Documentation</a>
            <a href="https://gitingest.com/michael-borck/deep-talk" target="_blank" class="inline-flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white px-6 py-3 text-base font-semibold shadow-sm rounded-lg transition-colors">Ingest</a>
            <a href="https://deepwiki.com/michael-borck/deep-talk" target="_blank" class="inline-flex items-center justify-center bg-stone-700 hover:bg-stone-800 text-white px-6 py-3 text-base font-semibold shadow-sm rounded-lg transition-colors">Deep Wiki</a>
        </div>
    </div>
</section>

<section id="features" class="py-16 sm:py-20 lg:py-24 bg-white dark:bg-stone-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">Features</h2>
        </div>
        <div class="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div class="p-6 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-700">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Audio/Video Support</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-400">🎬 : Process MP3, WAV, MP4, AVI, MOV, and more</p>
            </div>
            <div class="p-6 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-700">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Privacy-First</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-400">🔒 : All data stored locally on your machine</p>
            </div>
            <div class="p-6 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-700">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-white">AI-Powered</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-400">🎯 : Transcription via Speaches, analysis via Ollama</p>
            </div>
            <div class="p-6 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-700">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-white">No Dependencies</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-400">📦 : FFmpeg bundled - works out of the box</p>
            </div>
            <div class="p-6 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-700">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Cross-Platform</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-400">🖥️ : Windows, macOS, and Linux support</p>
            </div>
        </div>
    </div>
</section>

<section id="installation" class="py-16 sm:py-20 lg:py-24 bg-stone-50 dark:bg-stone-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">Installation</h2>
        </div>
        <div class="mt-8 max-w-4xl mx-auto text-left prose-styles">
            <p>Download the latest release for your platform from the <a href="https://github.com/michael-borck/deep-talk/releases">Releases</a> page.</p>
        </div>
    </div>
</section>

<section id="development" class="py-16 sm:py-20 lg:py-24 bg-white dark:bg-stone-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">Development</h2>
        </div>
        <div class="mt-8 max-w-4xl mx-auto text-left prose-styles">
            <h3>Prerequisites</h3>
            <ul>
                <li>Node.js 20+</li>
                <li>npm or yarn</li>
                <li>(Optional) Speaches service running on http://localhost:8000</li>
                <li>(Optional) Ollama service running on http://localhost:11434</li>
            </ul>
            <h3>Setup</h3>
            <pre><code class="language-bash"># Clone the repository
git clone https://github.com/michael-borck/deep-talk.git
cd deep-talk

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run dist</code></pre>
        </div>
    </div>
</section>

<section id="release-process" class="py-16 sm:py-20 lg:py-24 bg-stone-50 dark:bg-stone-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">Release Process</h2>
        </div>
        <div class="mt-8 max-w-4xl mx-auto text-left prose-styles">
            <h3>GitHub Secrets Required</h3>
            <p>To enable automatic builds when you create a release tag, set up these GitHub secrets:</p>
            <ol>
                <li>
                    <p><strong>For macOS Code Signing (Optional)</strong>:</p>
                    <ul>
                        <li><code>MAC_CERTS</code>: Base64 encoded .p12 certificate</li>
                        <li><code>MAC_CERTS_PASSWORD</code>: Certificate password</li>
                        <li><code>APPLE_ID</code>: Your Apple ID</li>
                        <li><code>APPLE_ID_PASS</code>: App-specific password</li>
                        <li><code>APPLE_TEAM_ID</code>: Your Apple Developer Team ID</li>
                    </ul>
                </li>
                <li>
                    <p><strong>Automatic (Already exists)</strong>:</p>
                    <ul>
                        <li><code>GITHUB_TOKEN</code>: Automatically provided by GitHub Actions</li>
                    </ul>
                </li>
            </ol>
            <h3>Creating a Release</h3>
            <ol>
                <li>Update version in <code>package.json</code></li>
                <li>Commit changes: <code>git commit -am "Bump version to v1.0.0"</code></li>
                <li>Create tag: <code>git tag v1.0.0</code></li>
                <li>Push tag: <code>git push origin v1.0.0</code></li>
                <li>GitHub Actions will automatically build for all platforms</li>
                <li>Edit the draft release on GitHub and publish</li>
            </ol>
            <h3>Build Outputs</h3>
            <ul>
                <li><strong>Windows</strong>: <code>.exe</code> installer</li>
                <li><strong>macOS</strong>: <code>.dmg</code> installer and <code>.pkg</code> for Mac App Store</li>
                <li><strong>Linux</strong>: <code>.AppImage</code> and <code>.deb</code> packages</li>
            </ul>
        </div>
    </div>
</section>

<section id="architecture" class="py-16 sm:py-20 lg:py-24 bg-white dark:bg-stone-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">Architecture</h2>
        </div>
        <div class="mt-8 max-w-4xl mx-auto text-left prose-styles">
            <pre><code>DeepTalk/
├── src/               # React TypeScript source
├── public/            # Electron main process
├── database/          # SQLite schema
└── ffmpeg-binaries/   # Platform-specific FFmpeg</code></pre>
        </div>
    </div>
</section>

<section id="technologies" class="py-16 sm:py-20 lg:py-24 bg-stone-50 dark:bg-stone-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">Technologies</h2>
        </div>
        <div class="mt-8 max-w-4xl mx-auto text-left prose-styles">
            <ul>
                <li><strong>Frontend</strong>: React + TypeScript</li>
                <li><strong>Desktop</strong>: Electron</li>
                <li><strong>Database</strong>: SQLite (better-sqlite3)</li>
                <li><strong>Styling</strong>: Tailwind CSS</li>
                <li><strong>Transcription</strong>: Speaches API</li>
                <li><strong>AI Analysis</strong>: Ollama API</li>
                <li><strong>Media Processing</strong>: FFmpeg (bundled)</li>
            </ul>
        </div>
    </div>
</section>

<section id="license" class="py-16 sm:py-20 lg:py-24 bg-white dark:bg-stone-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
            <h2 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">License</h2>
        </div>
        <div class="mt-8 max-w-4xl mx-auto text-left prose-styles">
            <p>MIT</p>
        </div>
    </div>
</section>