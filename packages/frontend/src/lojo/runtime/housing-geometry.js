/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Real OSM footprints; demonstration housing records live separately in housing-data.js.
// Derived data © OpenStreetMap contributors, ODbL 1.0. Heights marked levels-estimate are not measured.
export const geometrySources = [
  {
    "id": "osm-buildings",
    "title": "OpenStreetMap 建筑轮廓与原始标签",
    "url": "https://api.openstreetmap.org/api/0.6/map?bbox=114.017,22.523,114.030,22.532",
    "attribution": "© OpenStreetMap contributors",
    "license": "ODbL 1.0",
    "licenseUrl": "https://www.openstreetmap.org/copyright",
    "checkedAt": "2026-10-02",
    "coordinateSystem": "WGS84 / EPSG:4326",
    "scope": "仅核实公开地图的建筑位置、轮廓、名称、层数或高度标签；未核实房源、室内、出租权、费用、居住体验和安全。"
  },
  {
    "id": "height-policy",
    "title": "建筑高度处理",
    "url": "https://wiki.openstreetmap.org/wiki/Key:building:levels",
    "checkedAt": "2026-10-02",
    "note": "OSM height 原样使用；只有 building:levels 时按每层 3 米估算并保留 levels-estimate 标识；没有两种标签则 height=null，保持平面。OSM 标签本身不等于现场测量。背景建筑始终平面。"
  },
  {
    "id": "xiasha-government",
    "title": "福田区沙头街道：下沙社区",
    "url": "https://www.szft.gov.cn/bmxx/qstjdbsc/zwxxgk/jgzn/sqgzz/content/post_12933279.html",
    "publishedAt": "2026-08-13",
    "checkedAt": "2026-10-02",
    "supports": [
      "下沙位于福田区西南部，北靠滨河大道、东邻上沙村。",
      "社区范围南至金域蓝湾。"
    ],
    "notEvidenceOf": [
      "具体建筑宜居质量",
      "当前真实房源",
      "平台推荐或实勘"
    ]
  },
  {
    "id": "shangsha-government",
    "title": "福田区沙头街道：上沙社区",
    "url": "https://www.szft.gov.cn/bmxx/qstjdbsc/zwxxgk/jgzn/sqgzz/content/post_12933283.html",
    "publishedAt": "2026-08-13",
    "checkedAt": "2026-10-02",
    "supports": [
      "上沙西邻下沙，北靠滨河大道。",
      "社区包含东村、48栋等自然村和中洲滨海华府、中洲迎海等物业小区。"
    ],
    "notEvidenceOf": [
      "具体建筑宜居质量",
      "当前真实房源",
      "平台推荐或实勘"
    ]
  }
];
export const housingGeometry = {
  "type": "FeatureCollection",
  "bbox": [
    114.017,
    22.523,
    114.03,
    22.532
  ],
  "features": [
    {
      "type": "Feature",
      "id": "osm-way-346315117",
      "properties": {
        "id": "osm-way-346315117",
        "osmId": 346315117,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/346315117",
        "sourceName": "",
        "buildingType": "residential",
        "height": null,
        "heightSource": "unknown",
        "center": [
          114.0198927,
          22.5289767
        ],
        "name": "样板楼 A",
        "propertyName": "",
        "area": "xiasha",
        "selected": true,
        "heightEstimate": false,
        "levels": null,
        "bbox": [
          114.0198141,
          22.5288841,
          114.0199712,
          22.5290692
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2017-01-09T15:56:32Z",
        "osmVersion": 3
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0199712,
              22.529007
            ],
            [
              114.0199034,
              22.5288841
            ],
            [
              114.0198141,
              22.5289463
            ],
            [
              114.0198819,
              22.5290692
            ],
            [
              114.0199712,
              22.529007
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-346315051",
      "properties": {
        "id": "osm-way-346315051",
        "osmId": 346315051,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/346315051",
        "sourceName": "",
        "buildingType": "residential",
        "height": null,
        "heightSource": "unknown",
        "center": [
          114.019843,
          22.5279491
        ],
        "name": "样板楼 B",
        "propertyName": "",
        "area": "xiasha",
        "selected": true,
        "heightEstimate": false,
        "levels": null,
        "bbox": [
          114.0197647,
          22.5278652,
          114.0199214,
          22.5280331
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2017-01-09T15:56:29Z",
        "osmVersion": 3
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0198479,
              22.5280331
            ],
            [
              114.0197647,
              22.5279101
            ],
            [
              114.0198382,
              22.5278652
            ],
            [
              114.0199214,
              22.5279882
            ],
            [
              114.0198479,
              22.5280331
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-346315174",
      "properties": {
        "id": "osm-way-346315174",
        "osmId": 346315174,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/346315174",
        "sourceName": "704",
        "buildingType": "residential",
        "height": 21.0,
        "heightSource": "levels-estimate",
        "center": [
          114.0185893,
          22.5307633
        ],
        "name": "样板楼 C",
        "propertyName": "泰然广场",
        "area": "xiasha",
        "selected": true,
        "heightEstimate": true,
        "levels": 7.0,
        "bbox": [
          114.0184948,
          22.5306967,
          114.0186863,
          22.5308258
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2022-01-22T03:04:30Z",
        "osmVersion": 5
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0186232,
              22.5308115
            ],
            [
              114.0186613,
              22.5308216
            ],
            [
              114.0186863,
              22.5307408
            ],
            [
              114.0185199,
              22.5306967
            ],
            [
              114.0184948,
              22.5307775
            ],
            [
              114.0185329,
              22.5307876
            ],
            [
              114.0185284,
              22.5308019
            ],
            [
              114.0186187,
              22.5308258
            ],
            [
              114.0186232,
              22.5308115
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-1429425708",
      "properties": {
        "id": "osm-way-1429425708",
        "osmId": 1429425708,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/1429425708",
        "sourceName": "5栋",
        "buildingType": "apartments",
        "height": 99.0,
        "heightSource": "levels-estimate",
        "center": [
          114.020188,
          22.5266796
        ],
        "name": "样板楼 D",
        "propertyName": "万科金域蓝湾",
        "area": "xiasha",
        "selected": true,
        "heightEstimate": true,
        "levels": 33.0,
        "bbox": [
          114.0200099,
          22.5264956,
          114.0203303,
          22.5268657
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2025-09-13T01:57:16Z",
        "osmVersion": 1
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0202171,
              22.5264956
            ],
            [
              114.0202005,
              22.5265642
            ],
            [
              114.0201735,
              22.5266273
            ],
            [
              114.0201332,
              22.5266841
            ],
            [
              114.0200812,
              22.5267323
            ],
            [
              114.0200099,
              22.5267758
            ],
            [
              114.0200742,
              22.5268657
            ],
            [
              114.0201555,
              22.5268162
            ],
            [
              114.0202243,
              22.5267524
            ],
            [
              114.0202777,
              22.5266772
            ],
            [
              114.0203135,
              22.5265935
            ],
            [
              114.0203303,
              22.5265048
            ],
            [
              114.0202171,
              22.5264956
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-349913573",
      "properties": {
        "id": "osm-way-349913573",
        "osmId": 349913573,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/349913573",
        "sourceName": "",
        "buildingType": "residential",
        "height": null,
        "heightSource": "unknown",
        "center": [
          114.0232512,
          22.5257574
        ],
        "name": "样板楼 E",
        "propertyName": "上沙村48栋",
        "area": "shangsha",
        "selected": true,
        "heightEstimate": false,
        "levels": null,
        "bbox": [
          114.023187,
          22.5256991,
          114.0233154,
          22.5258158
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2022-06-27T20:21:02Z",
        "osmVersion": 4
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0232363,
              22.5258158
            ],
            [
              114.0233154,
              22.5257665
            ],
            [
              114.0232661,
              22.5256991
            ],
            [
              114.023187,
              22.5257483
            ],
            [
              114.0232363,
              22.5258158
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-345462401",
      "properties": {
        "id": "osm-way-345462401",
        "osmId": 345462401,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/345462401",
        "sourceName": "",
        "buildingType": "residential",
        "height": null,
        "heightSource": "unknown",
        "center": [
          114.026426,
          22.5245272
        ],
        "name": "样板楼 F",
        "propertyName": "上沙东村",
        "area": "shangsha",
        "selected": true,
        "heightEstimate": false,
        "levels": null,
        "bbox": [
          114.0263242,
          22.5244419,
          114.0265279,
          22.5246124
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2015-05-16T07:37:45Z",
        "osmVersion": 1
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.026369,
              22.5244419
            ],
            [
              114.0264526,
              22.5244686
            ],
            [
              114.0265279,
              22.5244926
            ],
            [
              114.0264831,
              22.5246124
            ],
            [
              114.0263242,
              22.5245617
            ],
            [
              114.026369,
              22.5244419
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-1429423866",
      "properties": {
        "id": "osm-way-1429423866",
        "osmId": 1429423866,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/1429423866",
        "sourceName": "B栋",
        "buildingType": "apartments",
        "height": 138.0,
        "heightSource": "levels-estimate",
        "center": [
          114.0245921,
          22.5265299
        ],
        "name": "样板楼 G",
        "propertyName": "中洲滨海华府一期",
        "area": "shangsha",
        "selected": true,
        "heightEstimate": true,
        "levels": 46.0,
        "bbox": [
          114.0244622,
          22.5263661,
          114.0247257,
          22.5266963
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2025-09-13T01:32:10Z",
        "osmVersion": 1
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0246715,
              22.5264395
            ],
            [
              114.0246288,
              22.5264944
            ],
            [
              114.0247257,
              22.5265588
            ],
            [
              114.0246188,
              22.5266963
            ],
            [
              114.0245249,
              22.5266339
            ],
            [
              114.0245604,
              22.5265882
            ],
            [
              114.0244925,
              22.5265431
            ],
            [
              114.0245079,
              22.5265233
            ],
            [
              114.0244622,
              22.526493
            ],
            [
              114.024561,
              22.5263661
            ],
            [
              114.0246715,
              22.5264395
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "id": "osm-way-1429423864",
      "properties": {
        "id": "osm-way-1429423864",
        "osmId": 1429423864,
        "osmType": "way",
        "osmUrl": "https://www.openstreetmap.org/way/1429423864",
        "sourceName": "2栋",
        "buildingType": "apartments",
        "height": 199.4,
        "heightSource": "osm:height",
        "center": [
          114.0259682,
          22.524954
        ],
        "name": "样板楼 H",
        "propertyName": "中洲湾·迎海一期",
        "area": "shangsha",
        "selected": true,
        "heightEstimate": false,
        "levels": 61.0,
        "bbox": [
          114.025785,
          22.5247835,
          114.0261747,
          22.5251419
        ],
        "checkedAt": "2026-10-02",
        "osmUpdatedAt": "2025-09-13T01:32:10Z",
        "osmVersion": 1
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              114.0259327,
              22.5249338
            ],
            [
              114.0258993,
              22.5249386
            ],
            [
              114.0258963,
              22.5249208
            ],
            [
              114.0258596,
              22.524926
            ],
            [
              114.0258537,
              22.5248905
            ],
            [
              114.025785,
              22.5249003
            ],
            [
              114.0258179,
              22.5250976
            ],
            [
              114.0258866,
              22.5250878
            ],
            [
              114.0258807,
              22.5250523
            ],
            [
              114.0259174,
              22.5250471
            ],
            [
              114.0259144,
              22.5250294
            ],
            [
              114.0259769,
              22.5250205
            ],
            [
              114.0259971,
              22.5251419
            ],
            [
              114.0260847,
              22.5251295
            ],
            [
              114.0260617,
              22.5249913
            ],
            [
              114.0261747,
              22.5249752
            ],
            [
              114.0261616,
              22.5248962
            ],
            [
              114.0260301,
              22.5249149
            ],
            [
              114.0260258,
              22.524889
            ],
            [
              114.026045,
              22.5248863
            ],
            [
              114.0260394,
              22.5248524
            ],
            [
              114.0260778,
              22.524847
            ],
            [
              114.0260673,
              22.5247835
            ],
            [
              114.0258537,
              22.5248138
            ],
            [
              114.0258642,
              22.5248773
            ],
            [
              114.0259027,
              22.5248718
            ],
            [
              114.0259083,
              22.5249057
            ],
            [
              114.0259275,
              22.524903
            ],
            [
              114.0259327,
              22.5249338
            ]
          ]
        ]
      }
    }
  ]
};
