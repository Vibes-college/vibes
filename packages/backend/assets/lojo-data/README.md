# ip-region.bin

Offline IP-to-region table for the anonymous start-up records (`packages/backend/src/misc/lojo-ip-region.ts`).
It keeps only the country, and for mainland China the province and carrier (telecom / unicom / mobile / other).

Built by `scripts/lojo-ip-region.py` from the ip2region data (`data/ipv4_source.txt` and `data/ipv6_source.txt`)
at https://github.com/lionsoul2014/ip2region, commit f8410adb25 (2026-11-09).

ip2region is Copyright lionsoul2014 and contributors, dual-licensed under the Apache License 2.0 and the MIT License
(SPDX: Apache-2.0 OR MIT). This derived table is used under the MIT License.
