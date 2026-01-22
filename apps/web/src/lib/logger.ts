/**
 * Development Logger Utility
 * 
 * Only outputs logs in development environments (localhost or NODE_ENV=development)
 * Suppresses all logs in production (game.zo.xyz)
 * 
 * Usage:
 * import { devLog } from '@/lib/logger';
 * 
 * devLog.log('This only shows in development');
 * devLog.error('Error in development only');
 * devLog.warn('Warning in development only');
 */

const isDevelopment = (): boolean => {
    // Logging disabled - set NEXT_PUBLIC_DEBUG_LOGS=true to enable
    if (typeof window !== 'undefined') {
        return window.localStorage.getItem('debug_logs') === 'true';
    }
    return process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';
};

/**
 * Development-only logger
 * Provides same API as console but only logs in development
 */
export const devLog = {
    log: (...args: any[]) => {
        if (isDevelopment()) {
            console.log(...args);
        }
    },

    error: (...args: any[]) => {
        if (isDevelopment()) {
            console.error(...args);
        }
    },

    warn: (...args: any[]) => {
        if (isDevelopment()) {
            console.warn(...args);
        }
    },

    info: (...args: any[]) => {
        if (isDevelopment()) {
            console.info(...args);
        }
    },

    debug: (...args: any[]) => {
        if (isDevelopment()) {
            console.debug(...args);
        }
    },

    table: (...args: any[]) => {
        if (isDevelopment()) {
            console.table(...args);
        }
    },

    group: (...args: any[]) => {
        if (isDevelopment()) {
            console.group(...args);
        }
    },

    groupEnd: () => {
        if (isDevelopment()) {
            console.groupEnd();
        }
    },
};

/**
 * Always log (even in production)
 * Use sparingly for critical errors only
 */
export const prodLog = {
    error: (...args: any[]) => {
        console.error('[PROD ERROR]', ...args);
    },

    warn: (...args: any[]) => {
        console.warn('[PROD WARNING]', ...args);
    },
};

export default devLog;
