---
---

document.addEventListener('DOMContentLoaded', () => {
    const setupThemeToggle = () => {
        const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
        const darkIcon = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;
        const lightIcon = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 5.05A1 1 0 016.465 3.636l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5 11a1 1 0 100-2H4a1 1 0 100 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>`;
        
        const updateIcons = (isDark) => { 
            themeToggleBtns.forEach(btn => { 
                btn.innerHTML = isDark ? lightIcon : darkIcon; 
            }); 
        };
        
        const isDark = localStorage.getItem('theme') === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        updateIcons(isDark);
        
        themeToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const isCurrentlyDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', isCurrentlyDark ? 'dark' : 'light');
                updateIcons(isCurrentlyDark);
            });
        });
    };
    
    setupThemeToggle();
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        const menuOpenIcon = document.getElementById('menu-open-icon');
        const menuCloseIcon = document.getElementById('menu-close-icon');
        
        mobileMenuButton.addEventListener('click', () => { 
            mobileMenu.classList.toggle('hidden'); 
            menuOpenIcon.classList.toggle('hidden'); 
            menuCloseIcon.classList.toggle('hidden'); 
        });
        
        const navLinks = mobileMenu.querySelectorAll('a');
        navLinks.forEach(link => { 
            link.addEventListener('click', () => { 
                mobileMenu.classList.add('hidden'); 
                menuOpenIcon.classList.remove('hidden'); 
                menuCloseIcon.classList.add('hidden'); 
            }); 
        });
    }
    
    // API tabs functionality
    const apiTabs = document.querySelectorAll('.api-tab');
    const apiPanels = document.querySelectorAll('.api-tab-panel');
    if (apiTabs.length > 0) {
        apiTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                apiTabs.forEach(t => t.classList.remove('active-tab'));
                tab.classList.add('active-tab');
                const target = document.getElementById(tab.dataset.target);
                apiPanels.forEach(panel => panel.classList.add('hidden'));
                if (target) target.classList.remove('hidden');
            });
        });
    }
    
    // Copy button functionality
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const codeElement = document.getElementById(button.dataset.code);
            if (codeElement) {
                navigator.clipboard.writeText(codeElement.innerText).then(() => {
                    button.innerText = 'Copied!';
                    setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                }).catch(err => { 
                    console.error('Failed to copy text: ', err); 
                    button.innerText = 'Error'; 
                });
            }
        });
    });
});