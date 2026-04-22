export const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

export const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// Peerlist-style knot/loop logo
export const PeerlistLogo = () => (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M26 8C26 8 18 14 18 22C18 26.4183 21.5817 30 26 30C30.4183 30 34 26.4183 34 22C34 17.5817 30.4183 14 26 14"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M26 22C26 22 18 28 18 36C18 40.4183 21.5817 44 26 44C30.4183 44 34 40.4183 34 36C34 31.5817 30.4183 28 26 28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M14 26C14 26 20 18 28 18C32.4183 18 36 21.5817 36 26C36 30.4183 32.4183 34 28 34C23.5817 34 20 30.4183 20 26"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M28 26C28 26 38 20 38 26C38 30.4183 34.4183 34 30 34"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
    </svg>
);


export const Logo = () => (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left loop */}
        <ellipse cx="22" cy="28" rx="9" ry="14" stroke="white" strokeWidth="2.2" fill="none" />
        {/* Right loop */}
        <ellipse cx="34" cy="28" rx="9" ry="14" stroke="white" strokeWidth="2.2" fill="none" />
        {/* Center vertical overlap mask areas */}
        <rect x="26" y="14" width="8" height="28" fill="#1a1a1a" />
        <rect x="22" y="14" width="8" height="28" fill="#1a1a1a" />
        {/* Redraw inner edges */}
        <path d="M28 14 C28 14 25 20 25 28 C25 36 28 42 28 42" stroke="white" strokeWidth="2.2" fill="none" />
        <path d="M28 14 C28 14 31 20 31 28 C31 36 28 42 28 42" stroke="white" strokeWidth="2.2" fill="none" />
        {/* Outer arcs */}
        <path d="M22 14 C16 14 13 20 13 28 C13 36 16 42 22 42" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M34 14 C40 14 43 20 43 28 C43 36 40 42 34 42" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
);