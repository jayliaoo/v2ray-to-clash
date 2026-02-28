/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Buffer } from 'node:buffer';
import yaml from 'yaml';
import rulesYaml from '../rules.yaml';

function addFlag(name) {
	if (name.startsWith('US')) {
		return `🇺🇸${name}`;
	}
	if (name.startsWith('Japan') || name.startsWith('JP')) {
		return `🇯🇵${name}`;
	}
	if (name.startsWith('HK') || name.startsWith('Hong Kong')) {
		return `🇭🇰${name}`;
	}
	if (name.startsWith('SG') || name.startsWith('Singapore')) {
		return `🇸🇬${name}`;
	}
	if (name.startsWith('MY') || name.startsWith('Malaysia')) {
		return `🇲🇾${name}`;
	}
	if (name.startsWith('ID') || name.startsWith('Indonesia')) {
		return `🇮🇩${name}`;
	}
	if (name.startsWith('TH') || name.startsWith('Thailand')) {
		return `🇹🇭${name}`;
	}
	if (name.startsWith('VN') || name.startsWith('Vietnam')) {
		return `🇻🇳${name}`;
	}
	if (name.startsWith('KR') || name.startsWith('Korea')) {
		return `🇰🇷${name}`;
	}
	if (name.startsWith('RU') || name.startsWith('Russia')) {
		return `🇷🇺${name}`;
	}
	if (name.startsWith('UK') || name.startsWith('United Kingdom')) {
		return `🇬🇧${name}`;
	}
	if (name.startsWith('AU') || name.startsWith('Australia')) {
		return `🇦🇺${name}`;
	}
	if (name.startsWith('IN') || name.startsWith('India')) {
		return `🇮🇳${name}`;
	}
	if (name.startsWith('TR') || name.startsWith('Turkey')) {
		return `🇹🇷${name}`;
	}
	if (name.startsWith('IT') || name.startsWith('Italy')) {
		return `🇮🇹${name}`;
	}
	if (name.startsWith('CA') || name.startsWith('Canada')) {
		return `🇨🇦${name}`;
	}
	if (name.startsWith('FR') || name.startsWith('France')) {
		return `🇫🇷${name}`;
	}
	if (name.startsWith('ES') || name.startsWith('Spain')) {
		return `🇪🇸${name}`;
	}
	if (name.startsWith('DE') || name.startsWith('Germany')) {
		return `🇩🇪${name}`;
	}
	if (name.startsWith('NL') || name.startsWith('Netherlands')) {
		return `🇳🇱${name}`;
	}
	return name;
}

async function convert(env) {
	const subscriptionUrl = env.SUBSCRIPTION_URL;
	const response = await fetch(subscriptionUrl);
	const data = await response.text();
	const decodedData = Buffer.from(data, 'base64').toString('utf-8');
	const lines = decodedData.split(/\r?\n/);
	const proxies = [];
	for (const line of lines) {
		if (line.startsWith('vmess://')) {
			const json = JSON.parse(Buffer.from(line.substring(8), 'base64').toString('utf-8'));
			const proxy = {
				type: 'vmess',
				name: addFlag(json.ps),
				server: json.add,
				port: json.port,
				uuid: json.id,
				alterId: json.aid,
				cipher: 'auto',
				tls: true,
				network: json.net,
				'ws-opts': {
					path: json.path,
					headers: {
						Host: json.host,
					},
				},
			};
			proxies.push(proxy);
		} else if (line.trim()) {
			const url = new URL(line);
			const proxy = {
				type: 'vless',
				name: addFlag(url.hash.substring(1)),
				server: url.hostname,
				port: Number(url.port),
				uuid: url.username,
				tls: true,
				servername: url.searchParams.get('host'),
				flow: url.searchParams.get('flow'),
				'client-fingerprint': 'chrome',
				alpn: url.searchParams.get('alpn').split(','),
				network: url.searchParams.get('type'),
			};
			if (url.searchParams.get('security') === 'reality') {
				proxy['reality-opts'] = {
					'public-key': url.searchParams.get('pbk'),
				};
			}
			proxies.push(proxy);
		}
	}
	const proxyNames = proxies.map((proxy) => proxy.name);
	const proxyGroups = [
		{
			name: 'v2net',
			type: 'select',
			proxies: ['♻️自动选择', '🔯故障转移', ...proxyNames],
		},
		{
			name: '♻️自动选择',
			type: 'url-test',
			url: 'http://1.1.1.1',
			interval: 600,
			proxies: proxyNames.filter((proxyName) => proxyName.endsWith('-x0')),
		},
		{
			name: '🔯故障转移',
			type: 'fallback',
			url: 'http://1.1.1.1',
			interval: 450,
			proxies: [...proxyNames],
		},
		{
			name: '✨AI',
			type: 'select',
			proxies: proxyNames.filter((proxyName) => /^(🇺🇸|🇯🇵|🇰🇷|🇮🇳|🇸🇬|🇩🇪|🇮🇹|🇬🇧|🇨🇦|🇫🇷|🇳🇱|🇪🇸|🇻🇳|🇮🇩|🇲🇾|🇹🇭|🇦🇺|🇹🇷|Taiwan)/.test(proxyName)),
		},
	];
	const config = yaml.parse(rulesYaml);
	config.proxies = proxies;
	config['proxy-groups'] = proxyGroups;
	return yaml.stringify(config);
}

export default {
	async scheduled(controller, env, ctx) {
		const yamlString = await convert(env);
		await env.R2.put('clash.yaml', yamlString);
	},

	async fetch(request, env, ctx) {
		const result = await env.R2.get('clash.yaml');
		return new Response(result.body);
	},
};
