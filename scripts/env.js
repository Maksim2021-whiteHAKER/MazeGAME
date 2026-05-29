// env.js 
export function getENV(){
    const urlParams = new URLSearchParams(window.location.search);
    const forceENV = urlParams.get('env');

    const host = window.location.hostname.toLowerCase();
    const isYandexDomain = host.includes('yandex.ru') || host.includes('htmlgames.ru') || host.includes('games.yandex');
    const hasSdk = typeof window.ysdk === 'object';

    if (forceENV === 'beta'){
        return {IS_YANDEX: false, IS_YANDEX_PROD: false, IS_GITHUB: false, IS_DEV: false, IS_BETA: true}
    } else if (forceENV === 'yandex') return {IS_YANDEX: true, IS_YANDEX_PROD: false, IS_GITHUB: false, IS_DEV: false, IS_BETA: false}
    
    return {
      IS_YANDEX: hasSdk || isYandexDomain,
      IS_YANDEX_PROD: hasSdk ? window.ysdk.environment === 'production' : false,
      IS_GITHUB: host.includes('github.io'),
      IS_DEV: host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0',
      IS_BETA: !hasSdk && host.includes('github.io')
    };
}
