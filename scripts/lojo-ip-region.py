#!/usr/bin/env python3
# SPDX-FileCopyrightText: syuilo and misskey-project
# SPDX-License-Identifier: AGPL-3.0-only
#
# Vibes: builds packages/backend/assets/lojo-data/ip-region.bin, the offline table the start-up records use to tell
# the region of a visitor (packages/backend/src/misc/lojo-ip-region.ts). Only coarse labels are kept: the country,
# and for the mainland also the province and the carrier (telecom / unicom / mobile / other). No city.
#
# Source: ip2region (https://github.com/lionsoul2014/ip2region, Apache-2.0 OR MIT), data/ipv4_source.txt and
# data/ipv6_source.txt. To refresh:
#   curl -LO https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ipv4_source.txt
#   curl -LO https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ipv6_source.txt
#   python3 scripts/lojo-ip-region.py ipv4_source.txt ipv6_source.txt
#
# File layout (little-endian):
#   "VIPR1" | u32 labels length | labels, UTF-8, joined by "\n" (label 0 is "" = unknown)
#   u32 n4 | n4 × u32 range starts (sorted) | n4 × u16 label
#   u32 n6 | n6 × (u32 high, u32 low) of the first 64 bits of each range start (sorted) | n6 × u16 label
# A range runs until the next start, so a lookup is one binary search.

import ipaddress
import struct
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'packages/backend/assets/lojo-data/ip-region.bin'


def carrier(isp: str) -> str:
	if '电信' in isp: return 'telecom'
	if '联通' in isp: return 'unicom'
	if '移动' in isp: return 'mobile'
	return 'other'


def label(line: str) -> tuple[int, str]:
	start, _end, _country, province, _city, isp, code = line.rstrip('\n').split('|')
	if code in ('0', '') or len(code) != 2:
		lab = ''
	elif code == 'CN':
		lab = 'CN|' + ('' if province == '0' else province) + '|' + carrier(isp)
	else:
		lab = code
	return int(ipaddress.ip_address(start)), lab


def ranges(path: str, shift: int) -> list[tuple[int, str]]:
	out: list[tuple[int, str]] = []
	for line in open(path, encoding='utf-8'):
		if not line.strip():
			continue
		start, lab = label(line)
		start >>= shift
		if out and out[-1][0] == start:
			continue  # several ranges inside the same /64: keep the first
		if out and out[-1][1] == lab:
			continue  # same label as the range before: merged
		out.append((start, lab))
	return out


def main(v4: str, v6: str) -> None:
	r4 = ranges(v4, 0)
	r6 = ranges(v6, 64)
	labels = [''] + sorted({lab for _, lab in r4 + r6} - {''})
	index = {lab: i for i, lab in enumerate(labels)}
	text = '\n'.join(labels).encode('utf-8')
	data = bytearray(b'VIPR1') + struct.pack('<I', len(text)) + text
	data += struct.pack('<I', len(r4))
	data += b''.join(struct.pack('<I', s) for s, _ in r4)
	data += b''.join(struct.pack('<H', index[lab]) for _, lab in r4)
	data += struct.pack('<I', len(r6))
	data += b''.join(struct.pack('<II', s >> 32, s & 0xffffffff) for s, _ in r6)
	data += b''.join(struct.pack('<H', index[lab]) for _, lab in r6)
	OUT.parent.mkdir(parents=True, exist_ok=True)
	OUT.write_bytes(data)
	print(f'{OUT}: {len(r4)} IPv4 ranges, {len(r6)} IPv6 ranges, {len(labels)} labels, {len(data) // 1024} KB')


if __name__ == '__main__':
	if len(sys.argv) != 3:
		sys.exit('usage: lojo-ip-region.py ipv4_source.txt ipv6_source.txt')
	main(sys.argv[1], sys.argv[2])
