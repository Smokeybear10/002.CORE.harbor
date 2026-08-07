import type { Alert, Geofence, Region, RiskHistoryPoint, VesselDetail } from "./api";

type DemoScenario = {
  description: string;
  savedAt: string;
  regions: Record<string, Region>;
  vessels: VesselDetail[];
  alerts: Alert[];
  geofences: Geofence[];
  history: Record<string, RiskHistoryPoint[]>;
};

export const demoScenario: DemoScenario = {
  "description": "Synthetic LA Harbor demo based on backend/app/seed.py, with approach tracks kept within the harbor view. Not live AIS or real incident evidence.",
  "savedAt": "2026-11-02T01:36:37Z",
  "regions": {
    "la_harbor": {
      "name": "Los Angeles Harbor",
      "center": [
        33.73,
        -118.26
      ],
      "zoom": 12.5,
      "description": "Port of Los Angeles / Long Beach \u2014 busiest US container port",
      "bbox": [
        [
          33.65,
          -118.35
        ],
        [
          33.8,
          -118.15
        ]
      ]
    }
  },
  "vessels": [
    {
      "id": "v-dark-horizon",
      "mmsi": "538006789",
      "name": "MV DARK HORIZON",
      "vessel_type": "cargo",
      "flag_state": "Marshall Islands",
      "length": 89.0,
      "beam": 14.0,
      "draft": 5.2,
      "imo": null,
      "callsign": null,
      "destination": "UNKNOWN",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.711654, "longitude": -118.219478, "speed_over_ground": 0.189563, "course_over_ground": 270.723536, "heading": 299.492743},
      "risk_score": 100.0,
      "recommended_action": "escalate",
      "is_inactive": true,
      "is_resolved": false,
      "status_reason": "Stationary for 5 min",
      "positions": [
        {"timestamp": "2026-11-01T21:32:07Z", "latitude": 33.680084, "longitude": -118.270285, "speed_over_ground": 8.020023, "course_over_ground": 6.339264, "heading": 8.945885},
        {"timestamp": "2026-11-01T21:34:07Z", "latitude": 33.683035, "longitude": -118.270106, "speed_over_ground": 8.137537, "course_over_ground": 5.178783, "heading": 6.874552},
        {"timestamp": "2026-11-01T21:36:07Z", "latitude": 33.685316, "longitude": -118.270035, "speed_over_ground": 8.319908, "course_over_ground": 8.269649, "heading": 6.881762},
        {"timestamp": "2026-11-01T21:38:07Z", "latitude": 33.688586, "longitude": -118.270079, "speed_over_ground": 8.444655, "course_over_ground": 9.188836, "heading": 7.361002},
        {"timestamp": "2026-11-01T21:40:07Z", "latitude": 33.691474, "longitude": -118.270157, "speed_over_ground": 7.874197, "course_over_ground": 5.580298, "heading": 9.389977},
        {"timestamp": "2026-11-01T21:42:07Z", "latitude": 33.694184, "longitude": -118.269838, "speed_over_ground": 8.228982, "course_over_ground": 10.838695, "heading": 7.514138},
        {"timestamp": "2026-11-01T21:44:07Z", "latitude": 33.696998, "longitude": -118.269863, "speed_over_ground": 8.489366, "course_over_ground": 8.464113, "heading": 8.818287},
        {"timestamp": "2026-11-01T21:46:07Z", "latitude": 33.699437, "longitude": -118.270424, "speed_over_ground": 7.863834, "course_over_ground": 6.396745, "heading": 6.404006},
        {"timestamp": "2026-11-01T21:48:07Z", "latitude": 33.702481, "longitude": -118.270556, "speed_over_ground": 8.096145, "course_over_ground": 6.257042, "heading": 7.067911},
        {"timestamp": "2026-11-01T21:50:07Z", "latitude": 33.705289, "longitude": -118.27006, "speed_over_ground": 7.936911, "course_over_ground": 9.374761, "heading": 6.65361},
        {"timestamp": "2026-11-01T21:52:07Z", "latitude": 33.708294, "longitude": -118.270138, "speed_over_ground": 8.24556, "course_over_ground": 9.107686, "heading": 9.371408},
        {"timestamp": "2026-11-01T21:54:07Z", "latitude": 33.710637, "longitude": -118.270282, "speed_over_ground": 8.052362, "course_over_ground": 6.606445, "heading": 6.843931},
        {"timestamp": "2026-11-01T21:56:07Z", "latitude": 33.713826, "longitude": -118.269758, "speed_over_ground": 8.324351, "course_over_ground": 7.373791, "heading": 9.65819},
        {"timestamp": "2026-11-01T21:58:07Z", "latitude": 33.716259, "longitude": -118.269832, "speed_over_ground": 8.249095, "course_over_ground": 6.57645, "heading": 8.338344},
        {"timestamp": "2026-11-01T22:00:07Z", "latitude": 33.71914, "longitude": -118.26953, "speed_over_ground": 8.59803, "course_over_ground": 8.057158, "heading": 6.363638},
        {"timestamp": "2026-11-01T22:02:07Z", "latitude": 33.722584, "longitude": -118.26988, "speed_over_ground": 7.765789, "course_over_ground": 10.548921, "heading": 3.565364},
        {"timestamp": "2026-11-01T22:04:07Z", "latitude": 33.722845, "longitude": -118.268606, "speed_over_ground": 6.828972, "course_over_ground": 42.922428, "heading": 48.694903},
        {"timestamp": "2026-11-01T22:06:07Z", "latitude": 33.723736, "longitude": -118.268819, "speed_over_ground": 5.506889, "course_over_ground": 62.414436, "heading": 58.683639},
        {"timestamp": "2026-11-01T22:08:07Z", "latitude": 33.723612, "longitude": -118.268133, "speed_over_ground": 4.784577, "course_over_ground": 75.231043, "heading": 82.492098},
        {"timestamp": "2026-11-01T22:10:07Z", "latitude": 33.723948, "longitude": -118.267753, "speed_over_ground": 3.825512, "course_over_ground": 103.267781, "heading": 109.869826},
        {"timestamp": "2026-11-01T22:12:07Z", "latitude": 33.724041, "longitude": -118.265956, "speed_over_ground": 2.722311, "course_over_ground": 128.968896, "heading": 123.414324},
        {"timestamp": "2026-11-01T22:14:07Z", "latitude": 33.723817, "longitude": -118.265365, "speed_over_ground": 1.557506, "course_over_ground": 158.787581, "heading": 150.796731},
        {"timestamp": "2026-11-01T22:16:07Z", "latitude": 33.723372, "longitude": -118.264321, "speed_over_ground": 0.2, "course_over_ground": 173.389535, "heading": 178.696183},
        {"timestamp": "2026-11-01T22:36:07Z", "latitude": 33.751512, "longitude": -118.265212, "speed_over_ground": 0.092254, "course_over_ground": 20.85306, "heading": 16.709594},
        {"timestamp": "2026-11-01T22:38:07Z", "latitude": 33.751042, "longitude": -118.265937, "speed_over_ground": 6.714976, "course_over_ground": 24.916507, "heading": 21.200421},
        {"timestamp": "2026-11-01T22:40:07Z", "latitude": 33.74906, "longitude": -118.26551, "speed_over_ground": 2.450565, "course_over_ground": 197.929294, "heading": 197.160673},
        {"timestamp": "2026-11-01T22:42:07Z", "latitude": 33.75092, "longitude": -118.268195, "speed_over_ground": 1.923596, "course_over_ground": 194.146592, "heading": 192.263755},
        {"timestamp": "2026-11-01T22:44:07Z", "latitude": 33.749752, "longitude": -118.26693, "speed_over_ground": 0.298545, "course_over_ground": 233.956101, "heading": 230.166143},
        {"timestamp": "2026-11-01T22:46:07Z", "latitude": 33.750353, "longitude": -118.26808, "speed_over_ground": 6.061743, "course_over_ground": 121.710802, "heading": 118.912976},
        {"timestamp": "2026-11-01T22:48:07Z", "latitude": 33.748916, "longitude": -118.265378, "speed_over_ground": 1.641986, "course_over_ground": 227.197065, "heading": 230.793419},
        {"timestamp": "2026-11-01T22:50:07Z", "latitude": 33.750676, "longitude": -118.268143, "speed_over_ground": 1.641715, "course_over_ground": 85.681668, "heading": 82.004787},
        {"timestamp": "2026-11-01T22:52:07Z", "latitude": 33.749891, "longitude": -118.265862, "speed_over_ground": 0.280654, "course_over_ground": 205.575514, "heading": 208.650484},
        {"timestamp": "2026-11-01T22:54:07Z", "latitude": 33.749724, "longitude": -118.267306, "speed_over_ground": 5.976025, "course_over_ground": 34.895093, "heading": 34.56534},
        {"timestamp": "2026-11-01T22:56:07Z", "latitude": 33.751937, "longitude": -118.268606, "speed_over_ground": 2.958152, "course_over_ground": 242.411237, "heading": 241.43745},
        {"timestamp": "2026-11-01T22:58:07Z", "latitude": 33.748995, "longitude": -118.268239, "speed_over_ground": 2.178605, "course_over_ground": 310.202113, "heading": 309.688249},
        {"timestamp": "2026-11-01T23:00:07Z", "latitude": 33.748999, "longitude": -118.265307, "speed_over_ground": 0.126564, "course_over_ground": 100.276252, "heading": 99.70756},
        {"timestamp": "2026-11-01T23:02:07Z", "latitude": 33.748202, "longitude": -118.265003, "speed_over_ground": 7.653373, "course_over_ground": 198.117112, "heading": 201.477388},
        {"timestamp": "2026-11-01T23:04:07Z", "latitude": 33.751395, "longitude": -118.268335, "speed_over_ground": 3.437993, "course_over_ground": 333.492114, "heading": 333.348525},
        {"timestamp": "2026-11-01T23:06:07Z", "latitude": 33.748235, "longitude": -118.267484, "speed_over_ground": 1.927495, "course_over_ground": 144.374505, "heading": 149.227594},
        {"timestamp": "2026-11-01T23:08:07Z", "latitude": 33.74982, "longitude": -118.267308, "speed_over_ground": 0.079561, "course_over_ground": 282.265417, "heading": 286.838593},
        {"timestamp": "2026-11-01T23:10:07Z", "latitude": 33.750874, "longitude": -118.268381, "speed_over_ground": 7.988557, "course_over_ground": 200.076596, "heading": 198.043675},
        {"timestamp": "2026-11-01T23:12:07Z", "latitude": 33.750169, "longitude": -118.266008, "speed_over_ground": 3.437419, "course_over_ground": 208.504905, "heading": 204.076557},
        {"timestamp": "2026-11-01T23:14:07Z", "latitude": 33.751411, "longitude": -118.26837, "speed_over_ground": 2.668355, "course_over_ground": 181.026138, "heading": 185.633927},
        {"timestamp": "2026-11-01T23:16:07Z", "latitude": 33.75038, "longitude": -118.266299, "speed_over_ground": 0.024033, "course_over_ground": 66.896986, "heading": 64.249025},
        {"timestamp": "2026-11-01T23:18:07Z", "latitude": 33.748985, "longitude": -118.266622, "speed_over_ground": 5.799717, "course_over_ground": 320.503433, "heading": 321.697248},
        {"timestamp": "2026-11-01T23:20:07Z", "latitude": 33.750091, "longitude": -118.265261, "speed_over_ground": 2.33845, "course_over_ground": 210.122024, "heading": 207.164616},
        {"timestamp": "2026-11-01T23:22:07Z", "latitude": 33.749583, "longitude": -118.266313, "speed_over_ground": 2.932384, "course_over_ground": 85.926943, "heading": 83.926914},
        {"timestamp": "2026-11-01T23:24:07Z", "latitude": 33.74829, "longitude": -118.267167, "speed_over_ground": 0.094853, "course_over_ground": 270.671217, "heading": 275.655762},
        {"timestamp": "2026-11-01T23:26:07Z", "latitude": 33.747573, "longitude": -118.260287, "speed_over_ground": 15.988289, "course_over_ground": 93.121603, "heading": 97.599556},
        {"timestamp": "2026-11-01T23:27:37Z", "latitude": 33.747799, "longitude": -118.252149, "speed_over_ground": 15.642593, "course_over_ground": 92.261975, "heading": 97.00247},
        {"timestamp": "2026-11-01T23:29:07Z", "latitude": 33.746963, "longitude": -118.243723, "speed_over_ground": 15.11062, "course_over_ground": 96.231811, "heading": 92.046939},
        {"timestamp": "2026-11-01T23:30:37Z", "latitude": 33.746102, "longitude": -118.236503, "speed_over_ground": 15.451312, "course_over_ground": 98.51144, "heading": 92.805747},
        {"timestamp": "2026-11-01T23:32:07Z", "latitude": 33.745349, "longitude": -118.2289, "speed_over_ground": 13.346286, "course_over_ground": 93.178786, "heading": 95.628979},
        {"timestamp": "2026-11-01T23:33:37Z", "latitude": 33.74496, "longitude": -118.222157, "speed_over_ground": 15.152837, "course_over_ground": 93.111871, "heading": 94.931191},
        {"timestamp": "2026-11-01T23:35:07Z", "latitude": 33.745053, "longitude": -118.215135, "speed_over_ground": 15.716009, "course_over_ground": 94.388606, "heading": 93.660081},
        {"timestamp": "2026-11-01T23:36:37Z", "latitude": 33.744407, "longitude": -118.206745, "speed_over_ground": 13.010637, "course_over_ground": 93.095642, "heading": 96.447385},
        {"timestamp": "2026-11-01T23:38:07Z", "latitude": 33.743591, "longitude": -118.200878, "speed_over_ground": 14.655041, "course_over_ground": 91.601951, "heading": 97.298638},
        {"timestamp": "2026-11-01T23:39:37Z", "latitude": 33.743177, "longitude": -118.192738, "speed_over_ground": 15.711786, "course_over_ground": 95.660077, "heading": 92.888563},
        {"timestamp": "2026-11-01T23:41:07Z", "latitude": 33.747602, "longitude": -118.235327, "speed_over_ground": 0.0, "course_over_ground": 84.039128, "heading": 92.018758},
        {"timestamp": "2026-11-01T23:43:37Z", "latitude": 33.748432, "longitude": -118.23327, "speed_over_ground": 2.267527, "course_over_ground": 112.737957, "heading": 106.939488},
        {"timestamp": "2026-11-01T23:46:07Z", "latitude": 33.746871, "longitude": -118.233595, "speed_over_ground": 1.994267, "course_over_ground": 121.992476, "heading": 129.67517},
        {"timestamp": "2026-11-01T23:48:37Z", "latitude": 33.746973, "longitude": -118.231907, "speed_over_ground": 0.555473, "course_over_ground": 142.502038, "heading": 151.099659},
        {"timestamp": "2026-11-01T23:51:07Z", "latitude": 33.745833, "longitude": -118.230354, "speed_over_ground": 2.064775, "course_over_ground": 167.833691, "heading": 175.462015},
        {"timestamp": "2026-11-01T23:53:37Z", "latitude": 33.74546, "longitude": -118.23086, "speed_over_ground": 0.0, "course_over_ground": 172.396582, "heading": 169.040291},
        {"timestamp": "2026-11-01T23:56:07Z", "latitude": 33.743483, "longitude": -118.231068, "speed_over_ground": 2.187347, "course_over_ground": 204.893054, "heading": 211.108041},
        {"timestamp": "2026-11-01T23:58:37Z", "latitude": 33.743091, "longitude": -118.231365, "speed_over_ground": 0.44862, "course_over_ground": 212.268891, "heading": 219.712227},
        {"timestamp": "2026-11-02T00:01:07Z", "latitude": 33.742888, "longitude": -118.233518, "speed_over_ground": 2.078149, "course_over_ground": 239.737492, "heading": 238.943557},
        {"timestamp": "2026-11-02T00:03:37Z", "latitude": 33.74165, "longitude": -118.233444, "speed_over_ground": 0.72347, "course_over_ground": 248.883054, "heading": 239.356343},
        {"timestamp": "2026-11-02T00:06:07Z", "latitude": 33.742353, "longitude": -118.234727, "speed_over_ground": 0.0, "course_over_ground": 265.090077, "heading": 272.377135},
        {"timestamp": "2026-11-02T00:08:37Z", "latitude": 33.74269, "longitude": -118.236323, "speed_over_ground": 1.675408, "course_over_ground": 295.470226, "heading": 293.463793},
        {"timestamp": "2026-11-02T00:11:07Z", "latitude": 33.742779, "longitude": -118.237553, "speed_over_ground": 2.360245, "course_over_ground": 313.698395, "heading": 306.00523},
        {"timestamp": "2026-11-02T00:13:37Z", "latitude": 33.743876, "longitude": -118.237492, "speed_over_ground": 2.413829, "course_over_ground": 331.52641, "heading": 326.835737},
        {"timestamp": "2026-11-02T00:16:07Z", "latitude": 33.743821, "longitude": -118.238146, "speed_over_ground": 1.875654, "course_over_ground": 335.734441, "heading": 332.007987},
        {"timestamp": "2026-11-02T00:18:37Z", "latitude": 33.74509, "longitude": -118.238634, "speed_over_ground": 0.0, "course_over_ground": 1.699342, "heading": 359.40325},
        {"timestamp": "2026-11-02T00:21:07Z", "latitude": 33.745826, "longitude": -118.23785, "speed_over_ground": 1.830206, "course_over_ground": 19.225409, "heading": 9.259234},
        {"timestamp": "2026-11-02T00:23:37Z", "latitude": 33.747091, "longitude": -118.237715, "speed_over_ground": 1.854689, "course_over_ground": 42.809203, "heading": 47.648204},
        {"timestamp": "2026-11-02T00:26:07Z", "latitude": 33.747281, "longitude": -118.2368, "speed_over_ground": 0.36094, "course_over_ground": 56.730056, "heading": 60.01481},
        {"timestamp": "2026-11-02T00:28:37Z", "latitude": 33.747458, "longitude": -118.236118, "speed_over_ground": 2.150435, "course_over_ground": 69.283201, "heading": 73.678286},
        {"timestamp": "2026-11-02T00:31:07Z", "latitude": 33.739634, "longitude": -118.25039, "speed_over_ground": 1.582496, "course_over_ground": 234.025781, "heading": 227.895438},
        {"timestamp": "2026-11-02T00:33:07Z", "latitude": 33.741468, "longitude": -118.249777, "speed_over_ground": 1.971562, "course_over_ground": 220.183024, "heading": 232.26719},
        {"timestamp": "2026-11-02T00:35:07Z", "latitude": 33.739516, "longitude": -118.252873, "speed_over_ground": 1.553325, "course_over_ground": 259.241193, "heading": 252.848605},
        {"timestamp": "2026-11-02T00:37:07Z", "latitude": 33.73985, "longitude": -118.251605, "speed_over_ground": 2.529947, "course_over_ground": 244.391052, "heading": 242.655846},
        {"timestamp": "2026-11-02T00:39:07Z", "latitude": 33.74062, "longitude": -118.250823, "speed_over_ground": 2.156152, "course_over_ground": 227.096112, "heading": 217.186854},
        {"timestamp": "2026-11-02T00:41:07Z", "latitude": 33.739206, "longitude": -118.253107, "speed_over_ground": 2.304082, "course_over_ground": 216.783643, "heading": 226.336347},
        {"timestamp": "2026-11-02T00:43:07Z", "latitude": 33.737173, "longitude": -118.254011, "speed_over_ground": 2.854785, "course_over_ground": 270.091051, "heading": 255.823813},
        {"timestamp": "2026-11-02T00:45:07Z", "latitude": 33.739674, "longitude": -118.255118, "speed_over_ground": 2.162977, "course_over_ground": 229.587404, "heading": 227.020634},
        {"timestamp": "2026-11-02T00:47:07Z", "latitude": 33.738736, "longitude": -118.253889, "speed_over_ground": 1.180523, "course_over_ground": 260.38123, "heading": 252.700764},
        {"timestamp": "2026-11-02T00:49:07Z", "latitude": 33.738871, "longitude": -118.25338, "speed_over_ground": 0.519407, "course_over_ground": 262.484641, "heading": 250.68226},
        {"timestamp": "2026-11-02T00:51:07Z", "latitude": 33.739634, "longitude": -118.254984, "speed_over_ground": 1.115603, "course_over_ground": 244.011696, "heading": 230.518247},
        {"timestamp": "2026-11-02T00:53:07Z", "latitude": 33.737408, "longitude": -118.254391, "speed_over_ground": 3.469177, "course_over_ground": 229.935862, "heading": 234.963194},
        {"timestamp": "2026-11-02T00:55:07Z", "latitude": 33.739061, "longitude": -118.254491, "speed_over_ground": 2.584083, "course_over_ground": 289.031396, "heading": 292.410966},
        {"timestamp": "2026-11-02T00:57:07Z", "latitude": 33.738746, "longitude": -118.256433, "speed_over_ground": 2.266724, "course_over_ground": 267.541917, "heading": 279.45816},
        {"timestamp": "2026-11-02T00:59:07Z", "latitude": 33.736439, "longitude": -118.258237, "speed_over_ground": 2.161361, "course_over_ground": 269.492435, "heading": 273.622278},
        {"timestamp": "2026-11-02T01:09:07Z", "latitude": 33.712532, "longitude": -118.219957, "speed_over_ground": 0.313374, "course_over_ground": 98.855081, "heading": 27.894007},
        {"timestamp": "2026-11-02T01:11:37Z", "latitude": 33.711571, "longitude": -118.220457, "speed_over_ground": 0.159855, "course_over_ground": 194.4548, "heading": 49.814662},
        {"timestamp": "2026-11-02T01:14:07Z", "latitude": 33.711463, "longitude": -118.219612, "speed_over_ground": 0.35321, "course_over_ground": 23.122386, "heading": 146.735773},
        {"timestamp": "2026-11-02T01:16:37Z", "latitude": 33.712085, "longitude": -118.220168, "speed_over_ground": 0.103417, "course_over_ground": 151.251666, "heading": 325.741852},
        {"timestamp": "2026-11-02T01:19:07Z", "latitude": 33.712168, "longitude": -118.219609, "speed_over_ground": 0.428366, "course_over_ground": 275.614047, "heading": 136.93717},
        {"timestamp": "2026-11-02T01:21:37Z", "latitude": 33.711012, "longitude": -118.220296, "speed_over_ground": 0.376738, "course_over_ground": 307.241262, "heading": 343.234922},
        {"timestamp": "2026-11-02T01:24:07Z", "latitude": 33.711838, "longitude": -118.219505, "speed_over_ground": 0.273066, "course_over_ground": 217.170932, "heading": 79.39393},
        {"timestamp": "2026-11-02T01:26:37Z", "latitude": 33.711439, "longitude": -118.220128, "speed_over_ground": 0.014512, "course_over_ground": 121.006636, "heading": 244.491079},
        {"timestamp": "2026-11-02T01:29:07Z", "latitude": 33.711809, "longitude": -118.22067, "speed_over_ground": 0.233695, "course_over_ground": 45.946007, "heading": 224.012506},
        {"timestamp": "2026-11-02T01:31:37Z", "latitude": 33.711054, "longitude": -118.220212, "speed_over_ground": 0.282196, "course_over_ground": 9.756737, "heading": 231.389873},
        {"timestamp": "2026-11-02T01:34:07Z", "latitude": 33.711271, "longitude": -118.220077, "speed_over_ground": 0.025142, "course_over_ground": 136.477391, "heading": 76.197702},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.711654, "longitude": -118.219478, "speed_over_ground": 0.189563, "course_over_ground": 270.723536, "heading": 299.492743}
      ],
      "anomaly_signals": [
        {
          "anomaly_type": "ais_gap",
          "severity": 0.88,
          "description": "Two AIS transmission gaps detected: 18 minutes (08:46\u201309:04 UTC) and 8 minutes (11:22\u201311:30 UTC). Vessel reappeared 2.1 nm from last known position after first gap \u2014 inside APM Terminal Restricted Zone. Gap duration and positional displacement exceed normal equipment failure patterns.",
          "details": {
            "gaps": [
              {
                "start": "2026-03-27T08:46:00Z",
                "end": "2026-03-27T09:04:00Z",
                "duration_min": 18,
                "displacement_nm": 2.1
              },
              {
                "start": "2026-03-27T11:22:00Z",
                "end": "2026-03-27T11:30:00Z",
                "duration_min": 8,
                "displacement_nm": 0.8
              }
            ],
            "total_gaps": 2,
            "max_gap_min": 18,
            "intentional_confidence": "high"
          }
        },
        {
          "anomaly_type": "geofence_breach",
          "severity": 0.92,
          "description": "Vessel entered APM Terminal Restricted Zone (gf-restricted-terminal) at 09:04 UTC and remained inside for approximately 50 minutes with loitering behavior. No port authority clearance on file. Additionally approached within 0.3 nm of LNG Terminal Security Zone perimeter at 10:18 UTC.",
          "details": {
            "breached_zones": [
              {
                "zone_id": "gf-restricted-terminal",
                "zone_name": "APM Terminal Restricted Zone",
                "severity": "high",
                "duration_min": 50
              },
              {
                "zone_id": "gf-security-zone-lng",
                "zone_name": "LNG Terminal Security Zone",
                "severity": "high",
                "approach_nm": 0.3
              }
            ],
            "clearance_verified": false
          }
        },
        {
          "anomaly_type": "loitering",
          "severity": 0.7,
          "description": "Loitering detected in restricted terminal zone: 25 position reports over 50 minutes within a 0.4 nm radius. Speed oscillated between 0\u20138 kt with no consistent heading \u2014 inconsistent with cargo operations or anchorage waiting.",
          "details": {
            "duration_min": 50,
            "radius_nm": 0.4,
            "position_count": 25,
            "avg_speed_kt": 2.3,
            "speed_variance": 6.8,
            "heading_variance_deg": 142
          }
        },
        {
          "anomaly_type": "route_deviation",
          "severity": 0.55,
          "description": "Vessel declared destination 'UNKNOWN' with no filed voyage plan. Track shows low correlation with standard LA Harbor approach routes. Course changed >90\u00b0 on 4 occasions.",
          "details": {
            "declared_destination": "UNKNOWN",
            "voyage_plan_filed": false,
            "course_changes_over_90deg": 4,
            "route_correlation_pct": 18
          }
        },
        {
          "anomaly_type": "type_mismatch",
          "severity": 0.85,
          "description": "Multiple identity red flags: IMO number missing (required for cargo vessels >300 GT), callsign not registered, flag state (Marshall Islands) on enhanced monitoring list. 4 inspection deficiencies from last PSC inspection (Jun 2025). MMSI 538006789 has no prior port calls in USCG database.",
          "details": {
            "missing_imo": true,
            "missing_callsign": true,
            "flag_state_risk": "elevated",
            "inspection_deficiencies": 4,
            "prior_port_calls": 0,
            "psc_detention_history": "unknown"
          }
        },
        {
          "anomaly_type": "zone_lingering",
          "severity": 0.78,
          "description": "Vessel lingered within 0.3 nm of LNG Terminal Security Zone for 50 minutes. Repeated slow passes along the perimeter suggest deliberate reconnaissance. Speed dropped to 0 kt on 4 occasions while oriented toward the terminal.",
          "details": {
            "zone_id": "gf-security-zone-lng",
            "zone_name": "LNG Terminal Security Zone",
            "linger_duration_min": 50,
            "min_distance_nm": 0.3,
            "dead_stops": 4,
            "perimeter_passes": 6
          }
        },
        {
          "anomaly_type": "speed_anomaly",
          "severity": 0.62,
          "description": "Abnormal speed profile: vessel accelerated to 14+ kt in restricted harbor zone (speed limit 8 kt) during sprint toward LNG terminal, then decelerated to near-zero within 3 minutes. Speed variance across track is 6.8 kt \u2014 3.2x the regional average for cargo vessels.",
          "details": {
            "max_speed_kt": 15.2,
            "zone_speed_limit_kt": 8,
            "speed_variance_kt": 6.8,
            "regional_avg_variance_kt": 2.1,
            "rapid_decel_events": 3
          }
        }
      ],
      "explanation": "MV DARK HORIZON exhibits 7 anomaly signals across identity, spatial, and behavioral dimensions. Vessel went dark twice before appearing inside APM Terminal Restricted Zone with sustained loitering. Sprinted at 14+ kt toward LNG terminal then lingered along its perimeter. No IMO, no callsign, no voyage plan, Marshall Islands flag. Recommend immediate USCG verification and potential boarding.",
      "inspection_deficiencies": 4,
      "last_inspection_date": "2025-06-15",
      "weather": null
    },
    {
      "id": "v-jade-star",
      "mmsi": "672301456",
      "name": "JADE STAR",
      "vessel_type": "cargo",
      "flag_state": "Comoros",
      "length": 112.0,
      "beam": 16.5,
      "draft": 6.1,
      "imo": "9876543",
      "callsign": "D6JS",
      "destination": "LONG BEACH",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.731, "longitude": -118.232, "speed_over_ground": 8.035864, "course_over_ground": 12.621896, "heading": 8.110899},
      "risk_score": 72.0,
      "recommended_action": "verify",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-02T00:39:07Z", "latitude": 33.358036, "longitude": -118.242112, "speed_over_ground": 7.519383, "course_over_ground": 350.39419, "heading": 352.999447},
        {"timestamp": "2026-11-02T00:41:37Z", "latitude": 33.360775, "longitude": -118.241782, "speed_over_ground": 8.151755, "course_over_ground": 352.542332, "heading": 352.69767},
        {"timestamp": "2026-11-02T00:44:07Z", "latitude": 33.362897, "longitude": -118.24234, "speed_over_ground": 7.626221, "course_over_ground": 351.694588, "heading": 350.383817},
        {"timestamp": "2026-11-02T00:46:37Z", "latitude": 33.365804, "longitude": -118.24214, "speed_over_ground": 7.667789, "course_over_ground": 351.072475, "heading": 351.487554},
        {"timestamp": "2026-11-02T00:49:07Z", "latitude": 33.368376, "longitude": -118.242253, "speed_over_ground": 7.608099, "course_over_ground": 345.256784, "heading": 348.871743},
        {"timestamp": "2026-11-02T00:51:37Z", "latitude": 33.370959, "longitude": -118.242487, "speed_over_ground": 8.215015, "course_over_ground": 345.759965, "heading": 351.143686},
        {"timestamp": "2026-11-02T00:54:07Z", "latitude": 33.372946, "longitude": -118.242185, "speed_over_ground": 8.350293, "course_over_ground": 351.004116, "heading": 347.72633},
        {"timestamp": "2026-11-02T00:56:37Z", "latitude": 33.375854, "longitude": -118.24215, "speed_over_ground": 7.928378, "course_over_ground": 348.705709, "heading": 350.035765},
        {"timestamp": "2026-11-02T00:59:07Z", "latitude": 33.378394, "longitude": -118.24196, "speed_over_ground": 7.605539, "course_over_ground": 354.607876, "heading": 350.813511},
        {"timestamp": "2026-11-02T01:01:37Z", "latitude": 33.380809, "longitude": -118.241995, "speed_over_ground": 8.233795, "course_over_ground": 354.654737, "heading": 348.620494},
        {"timestamp": "2026-11-02T01:06:07Z", "latitude": 34.213184, "longitude": -118.241695, "speed_over_ground": 8.5, "course_over_ground": 355.0, "heading": 355.0},
        {"timestamp": "2026-11-02T01:08:37Z", "latitude": 34.213175, "longitude": -118.24181, "speed_over_ground": 7.731026, "course_over_ground": 337.683955, "heading": 342.110279},
        {"timestamp": "2026-11-02T01:11:07Z", "latitude": 34.215383, "longitude": -118.24202, "speed_over_ground": 7.881631, "course_over_ground": 337.438634, "heading": 339.788251},
        {"timestamp": "2026-11-02T01:13:37Z", "latitude": 34.217251, "longitude": -118.241844, "speed_over_ground": 7.0287, "course_over_ground": 343.509528, "heading": 338.091039},
        {"timestamp": "2026-11-02T01:16:07Z", "latitude": 34.219012, "longitude": -118.241593, "speed_over_ground": 7.340339, "course_over_ground": 343.8032, "heading": 341.207103},
        {"timestamp": "2026-11-02T01:18:37Z", "latitude": 34.22105, "longitude": -118.242066, "speed_over_ground": 7.948063, "course_over_ground": 335.85613, "heading": 341.320448},
        {"timestamp": "2026-11-02T01:24:07Z", "latitude": 33.723184, "longitude": -118.231772, "speed_over_ground": 9.0, "course_over_ground": 175.0, "heading": 175.0},
        {"timestamp": "2026-11-02T01:26:37Z", "latitude": 33.723178, "longitude": -118.231617, "speed_over_ground": 8.190609, "course_over_ground": 11.459029, "heading": 9.944928},
        {"timestamp": "2026-11-02T01:29:07Z", "latitude": 33.72536, "longitude": -118.232016, "speed_over_ground": 7.721596, "course_over_ground": 11.917872, "heading": 8.837236},
        {"timestamp": "2026-11-02T01:31:37Z", "latitude": 33.727233, "longitude": -118.231788, "speed_over_ground": 8.030922, "course_over_ground": 9.255038, "heading": 11.475613},
        {"timestamp": "2026-11-02T01:34:07Z", "latitude": 33.729083, "longitude": -118.23165, "speed_over_ground": 7.770916, "course_over_ground": 7.514037, "heading": 7.723935},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.731, "longitude": -118.232, "speed_over_ground": 8.035864, "course_over_ground": 12.621896, "heading": 8.110899}
      ],
      "anomaly_signals": [
        {
          "anomaly_type": "kinematic_implausibility",
          "severity": 0.55,
          "description": "2 impossible position jumps detected (max 50.0 nm in under 2 minutes). Vessel appeared to teleport between locations \u2014 strong indicator of AIS position spoofing or GPS manipulation.",
          "details": {
            "impossible_jumps": 2,
            "max_jump_nm": 50.0,
            "max_implied_speed_kt": 1500.0,
            "spoofing_confidence": "high"
          }
        }
      ],
      "explanation": "AIS position data shows kinematic implausibility \u2014 2 position jumps exceeding physically possible vessel speed. Probable AIS spoofing or GPS manipulation. Verify actual position.",
      "inspection_deficiencies": 2,
      "last_inspection_date": "2025-09-20",
      "weather": null
    },
    {
      "id": "v-dark-optical-1",
      "mmsi": "900000001",
      "name": "UNIDENTIFIED VESSEL (Optical)",
      "vessel_type": "unidentified",
      "flag_state": "",
      "length": null,
      "beam": null,
      "draft": null,
      "imo": null,
      "callsign": null,
      "destination": "UNKNOWN",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.712503, "longitude": -118.281785, "speed_over_ground": 4.393269, "course_over_ground": 293.411319, "heading": 290.740822},
      "risk_score": 85.0,
      "recommended_action": "escalate",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-02T01:11:37Z", "latitude": 33.699887, "longitude": -118.250006, "speed_over_ground": 4.334751, "course_over_ground": 302.625712, "heading": 295.246369},
        {"timestamp": "2026-11-02T01:16:37Z", "latitude": 33.702378, "longitude": -118.256515, "speed_over_ground": 4.016471, "course_over_ground": 290.639731, "heading": 291.794415},
        {"timestamp": "2026-11-02T01:21:37Z", "latitude": 33.704736, "longitude": -118.262696, "speed_over_ground": 4.064587, "course_over_ground": 302.588719, "heading": 295.53359},
        {"timestamp": "2026-11-02T01:26:37Z", "latitude": 33.707475, "longitude": -118.269215, "speed_over_ground": 4.421077, "course_over_ground": 294.854059, "heading": 298.727197},
        {"timestamp": "2026-11-02T01:31:37Z", "latitude": 33.709891, "longitude": -118.275433, "speed_over_ground": 4.164281, "course_over_ground": 289.949819, "heading": 290.513767},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.712503, "longitude": -118.281785, "speed_over_ground": 4.393269, "course_over_ground": 293.411319, "heading": 290.740822}
      ],
      "anomaly_signals": [
        {
          "anomaly_type": "dark_ship_optical",
          "severity": 0.65,
          "description": "OPTICAL DARK SHIP DETECTION by SeaPod_Alpha. Unregistered vessel detected at range 3.3 nm, bearing 295\u00b0. No AIS transponder signal. Detection confidence: 50%. This vessel does not appear in any AIS database.",
          "details": {
            "source": "edge_node",
            "node_id": "SeaPod_Alpha",
            "raw_distance_m": 6112.0,
            "scaled_distance_nm": 3.3,
            "velocity_ms": 4.2,
            "heading_deg": 295,
            "confidence": 0.5,
            "stream_url": null
          }
        }
      ],
      "explanation": "Unidentified vessel detected by optical computer vision (SeaPod edge node). No AIS transponder, no registered identity. Detected at 3.3 nm range, bearing 295\u00b0, moving at ~4.2 kt.",
      "inspection_deficiencies": 0,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-aegean-voyager",
      "mmsi": "241234567",
      "name": "AEGEAN VOYAGER",
      "vessel_type": "tanker",
      "flag_state": "Greece",
      "length": 174.0,
      "beam": 28.0,
      "draft": 10.5,
      "imo": "9812345",
      "callsign": "SV2AEG",
      "destination": "LONG BEACH",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.716, "longitude": -118.225, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:32:19Z", "latitude": 33.692, "longitude": -118.235, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:35:07Z", "latitude": 33.69249, "longitude": -118.234796, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:37:37Z", "latitude": 33.69298, "longitude": -118.234592, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:40:12Z", "latitude": 33.693469, "longitude": -118.234388, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:42:48Z", "latitude": 33.693959, "longitude": -118.234184, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:45:21Z", "latitude": 33.694449, "longitude": -118.23398, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:47:58Z", "latitude": 33.694939, "longitude": -118.233776, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:50:25Z", "latitude": 33.695429, "longitude": -118.233571, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:52:43Z", "latitude": 33.695918, "longitude": -118.233367, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:55:20Z", "latitude": 33.696408, "longitude": -118.233163, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-01T23:57:33Z", "latitude": 33.696898, "longitude": -118.232959, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:00:15Z", "latitude": 33.697388, "longitude": -118.232755, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:02:29Z", "latitude": 33.697878, "longitude": -118.232551, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:05:02Z", "latitude": 33.698367, "longitude": -118.232347, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:07:38Z", "latitude": 33.698857, "longitude": -118.232143, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:10:19Z", "latitude": 33.699347, "longitude": -118.231939, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:12:46Z", "latitude": 33.699837, "longitude": -118.231735, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:15:05Z", "latitude": 33.700327, "longitude": -118.231531, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:17:36Z", "latitude": 33.700816, "longitude": -118.231327, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:20:10Z", "latitude": 33.701306, "longitude": -118.231122, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:22:58Z", "latitude": 33.701796, "longitude": -118.230918, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:25:36Z", "latitude": 33.702286, "longitude": -118.230714, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:28:08Z", "latitude": 33.702776, "longitude": -118.23051, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:30:30Z", "latitude": 33.703265, "longitude": -118.230306, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:32:52Z", "latitude": 33.703755, "longitude": -118.230102, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:35:23Z", "latitude": 33.704245, "longitude": -118.229898, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:37:42Z", "latitude": 33.704735, "longitude": -118.229694, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:40:21Z", "latitude": 33.705224, "longitude": -118.22949, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:43:08Z", "latitude": 33.705714, "longitude": -118.229286, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:45:52Z", "latitude": 33.706204, "longitude": -118.229082, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:48:27Z", "latitude": 33.706694, "longitude": -118.228878, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:51:02Z", "latitude": 33.707184, "longitude": -118.228673, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:53:40Z", "latitude": 33.707673, "longitude": -118.228469, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:56:26Z", "latitude": 33.708163, "longitude": -118.228265, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T00:59:09Z", "latitude": 33.708653, "longitude": -118.228061, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:01:31Z", "latitude": 33.709143, "longitude": -118.227857, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:03:50Z", "latitude": 33.709633, "longitude": -118.227653, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:06:07Z", "latitude": 33.710122, "longitude": -118.227449, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:08:51Z", "latitude": 33.710612, "longitude": -118.227245, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:11:26Z", "latitude": 33.711102, "longitude": -118.227041, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:13:56Z", "latitude": 33.711592, "longitude": -118.226837, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:16:43Z", "latitude": 33.712082, "longitude": -118.226633, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:18:57Z", "latitude": 33.712571, "longitude": -118.226429, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:21:30Z", "latitude": 33.713061, "longitude": -118.226224, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:24:06Z", "latitude": 33.713551, "longitude": -118.22602, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:26:34Z", "latitude": 33.714041, "longitude": -118.225816, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:28:52Z", "latitude": 33.714531, "longitude": -118.225612, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:31:34Z", "latitude": 33.71502, "longitude": -118.225408, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:33:58Z", "latitude": 33.71551, "longitude": -118.225204, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.716, "longitude": -118.225, "speed_over_ground": 0.7, "course_over_ground": 19.1, "heading": 19.1}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 1,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-ocean-phantom",
      "mmsi": "416789012",
      "name": "OCEAN PHANTOM",
      "vessel_type": "fishing",
      "flag_state": "Taiwan",
      "length": 35.0,
      "beam": 8.0,
      "draft": 3.2,
      "imo": null,
      "callsign": null,
      "destination": "UNKNOWN",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.694, "longitude": -118.214, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:34:56Z", "latitude": 33.66, "longitude": -118.2, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:37:37Z", "latitude": 33.660694, "longitude": -118.200286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:40:10Z", "latitude": 33.661388, "longitude": -118.200571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:42:33Z", "latitude": 33.662082, "longitude": -118.200857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:44:48Z", "latitude": 33.662776, "longitude": -118.201143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:47:34Z", "latitude": 33.663469, "longitude": -118.201429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:50:04Z", "latitude": 33.664163, "longitude": -118.201714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:52:50Z", "latitude": 33.664857, "longitude": -118.202, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:55:15Z", "latitude": 33.665551, "longitude": -118.202286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-01T23:57:51Z", "latitude": 33.666245, "longitude": -118.202571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:00:07Z", "latitude": 33.666939, "longitude": -118.202857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:02:51Z", "latitude": 33.667633, "longitude": -118.203143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:05:08Z", "latitude": 33.668327, "longitude": -118.203429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:07:20Z", "latitude": 33.66902, "longitude": -118.203714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:09:59Z", "latitude": 33.669714, "longitude": -118.204, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:12:15Z", "latitude": 33.670408, "longitude": -118.204286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:14:46Z", "latitude": 33.671102, "longitude": -118.204571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:17:22Z", "latitude": 33.671796, "longitude": -118.204857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:19:37Z", "latitude": 33.67249, "longitude": -118.205143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:22:08Z", "latitude": 33.673184, "longitude": -118.205429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:24:43Z", "latitude": 33.673878, "longitude": -118.205714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:27:08Z", "latitude": 33.674571, "longitude": -118.206, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:29:33Z", "latitude": 33.675265, "longitude": -118.206286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:31:48Z", "latitude": 33.675959, "longitude": -118.206571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:34:12Z", "latitude": 33.676653, "longitude": -118.206857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:36:50Z", "latitude": 33.677347, "longitude": -118.207143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:39:26Z", "latitude": 33.678041, "longitude": -118.207429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:41:59Z", "latitude": 33.678735, "longitude": -118.207714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:44:34Z", "latitude": 33.679429, "longitude": -118.208, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:47:11Z", "latitude": 33.680122, "longitude": -118.208286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:49:37Z", "latitude": 33.680816, "longitude": -118.208571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:52:05Z", "latitude": 33.68151, "longitude": -118.208857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:54:20Z", "latitude": 33.682204, "longitude": -118.209143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:56:55Z", "latitude": 33.682898, "longitude": -118.209429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T00:59:23Z", "latitude": 33.683592, "longitude": -118.209714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:01:49Z", "latitude": 33.684286, "longitude": -118.21, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:04:10Z", "latitude": 33.68498, "longitude": -118.210286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:06:48Z", "latitude": 33.685673, "longitude": -118.210571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:09:01Z", "latitude": 33.686367, "longitude": -118.210857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:11:39Z", "latitude": 33.687061, "longitude": -118.211143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:14:13Z", "latitude": 33.687755, "longitude": -118.211429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:16:46Z", "latitude": 33.688449, "longitude": -118.211714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:19:04Z", "latitude": 33.689143, "longitude": -118.212, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:21:42Z", "latitude": 33.689837, "longitude": -118.212286, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:24:16Z", "latitude": 33.690531, "longitude": -118.212571, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:26:55Z", "latitude": 33.691224, "longitude": -118.212857, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:29:30Z", "latitude": 33.691918, "longitude": -118.213143, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:31:53Z", "latitude": 33.692612, "longitude": -118.213429, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:34:07Z", "latitude": 33.693306, "longitude": -118.213714, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.694, "longitude": -118.214, "speed_over_ground": 1.1, "course_over_ground": 341.1, "heading": 341.1}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 3,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-northern-spirit",
      "mmsi": "636098765",
      "name": "NORTHERN SPIRIT",
      "vessel_type": "cargo",
      "flag_state": "Liberia",
      "length": 145.0,
      "beam": 22.0,
      "draft": 8.4,
      "imo": "9654321",
      "callsign": "A8NS9",
      "destination": "SAN PEDRO",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.708, "longitude": -118.257, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:34:23Z", "latitude": 33.682, "longitude": -118.28, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:36:39Z", "latitude": 33.682531, "longitude": -118.279531, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:39:00Z", "latitude": 33.683061, "longitude": -118.279061, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:41:22Z", "latitude": 33.683592, "longitude": -118.278592, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:43:36Z", "latitude": 33.684122, "longitude": -118.278122, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:46:21Z", "latitude": 33.684653, "longitude": -118.277653, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:49:08Z", "latitude": 33.685184, "longitude": -118.277184, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:51:33Z", "latitude": 33.685714, "longitude": -118.276714, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:54:10Z", "latitude": 33.686245, "longitude": -118.276245, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:56:28Z", "latitude": 33.686776, "longitude": -118.275776, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-01T23:58:43Z", "latitude": 33.687306, "longitude": -118.275306, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:00:56Z", "latitude": 33.687837, "longitude": -118.274837, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:03:38Z", "latitude": 33.688367, "longitude": -118.274367, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:06:15Z", "latitude": 33.688898, "longitude": -118.273898, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:08:46Z", "latitude": 33.689429, "longitude": -118.273429, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:11:32Z", "latitude": 33.689959, "longitude": -118.272959, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:14:19Z", "latitude": 33.69049, "longitude": -118.27249, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:17:02Z", "latitude": 33.69102, "longitude": -118.27202, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:19:42Z", "latitude": 33.691551, "longitude": -118.271551, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:22:02Z", "latitude": 33.692082, "longitude": -118.271082, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:24:22Z", "latitude": 33.692612, "longitude": -118.270612, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:26:58Z", "latitude": 33.693143, "longitude": -118.270143, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:29:15Z", "latitude": 33.693673, "longitude": -118.269673, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:31:57Z", "latitude": 33.694204, "longitude": -118.269204, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:34:20Z", "latitude": 33.694735, "longitude": -118.268735, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:37:04Z", "latitude": 33.695265, "longitude": -118.268265, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:39:32Z", "latitude": 33.695796, "longitude": -118.267796, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:42:19Z", "latitude": 33.696327, "longitude": -118.267327, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:44:45Z", "latitude": 33.696857, "longitude": -118.266857, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:47:25Z", "latitude": 33.697388, "longitude": -118.266388, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:49:49Z", "latitude": 33.697918, "longitude": -118.265918, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:52:18Z", "latitude": 33.698449, "longitude": -118.265449, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:54:46Z", "latitude": 33.69898, "longitude": -118.26498, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:57:17Z", "latitude": 33.69951, "longitude": -118.26451, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T00:59:42Z", "latitude": 33.700041, "longitude": -118.264041, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:02:26Z", "latitude": 33.700571, "longitude": -118.263571, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:04:56Z", "latitude": 33.701102, "longitude": -118.263102, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:07:29Z", "latitude": 33.701633, "longitude": -118.262633, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:09:52Z", "latitude": 33.702163, "longitude": -118.262163, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:12:36Z", "latitude": 33.702694, "longitude": -118.261694, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:14:50Z", "latitude": 33.703224, "longitude": -118.261224, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:17:07Z", "latitude": 33.703755, "longitude": -118.260755, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:19:33Z", "latitude": 33.704286, "longitude": -118.260286, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:21:58Z", "latitude": 33.704816, "longitude": -118.259816, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:24:19Z", "latitude": 33.705347, "longitude": -118.259347, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:26:40Z", "latitude": 33.705878, "longitude": -118.258878, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:29:10Z", "latitude": 33.706408, "longitude": -118.258408, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:31:25Z", "latitude": 33.706939, "longitude": -118.257939, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:33:57Z", "latitude": 33.707469, "longitude": -118.257469, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.708, "longitude": -118.257, "speed_over_ground": 1.0, "course_over_ground": 36.4, "heading": 36.4}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 2,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-caspian-trader",
      "mmsi": "256345678",
      "name": "CASPIAN TRADER",
      "vessel_type": "tanker",
      "flag_state": "Malta",
      "length": 130.0,
      "beam": 20.0,
      "draft": 7.8,
      "imo": "9543210",
      "callsign": null,
      "destination": "UNKNOWN",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.695, "longitude": -118.285, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:33:44Z", "latitude": 33.67, "longitude": -118.31, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:35:59Z", "latitude": 33.67051, "longitude": -118.30949, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:38:41Z", "latitude": 33.67102, "longitude": -118.30898, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:41:05Z", "latitude": 33.671531, "longitude": -118.308469, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:43:33Z", "latitude": 33.672041, "longitude": -118.307959, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:45:56Z", "latitude": 33.672551, "longitude": -118.307449, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:48:17Z", "latitude": 33.673061, "longitude": -118.306939, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:50:47Z", "latitude": 33.673571, "longitude": -118.306429, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:53:21Z", "latitude": 33.674082, "longitude": -118.305918, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:55:56Z", "latitude": 33.674592, "longitude": -118.305408, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-01T23:58:26Z", "latitude": 33.675102, "longitude": -118.304898, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:01:03Z", "latitude": 33.675612, "longitude": -118.304388, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:03:22Z", "latitude": 33.676122, "longitude": -118.303878, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:06:09Z", "latitude": 33.676633, "longitude": -118.303367, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:08:31Z", "latitude": 33.677143, "longitude": -118.302857, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:10:52Z", "latitude": 33.677653, "longitude": -118.302347, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:13:31Z", "latitude": 33.678163, "longitude": -118.301837, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:16:17Z", "latitude": 33.678673, "longitude": -118.301327, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:18:47Z", "latitude": 33.679184, "longitude": -118.300816, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:21:15Z", "latitude": 33.679694, "longitude": -118.300306, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:23:47Z", "latitude": 33.680204, "longitude": -118.299796, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:26:09Z", "latitude": 33.680714, "longitude": -118.299286, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:28:50Z", "latitude": 33.681224, "longitude": -118.298776, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:31:20Z", "latitude": 33.681735, "longitude": -118.298265, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:33:54Z", "latitude": 33.682245, "longitude": -118.297755, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:36:32Z", "latitude": 33.682755, "longitude": -118.297245, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:38:55Z", "latitude": 33.683265, "longitude": -118.296735, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:41:36Z", "latitude": 33.683776, "longitude": -118.296224, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:44:16Z", "latitude": 33.684286, "longitude": -118.295714, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:46:51Z", "latitude": 33.684796, "longitude": -118.295204, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:49:37Z", "latitude": 33.685306, "longitude": -118.294694, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:52:04Z", "latitude": 33.685816, "longitude": -118.294184, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:54:20Z", "latitude": 33.686327, "longitude": -118.293673, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:56:39Z", "latitude": 33.686837, "longitude": -118.293163, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T00:59:14Z", "latitude": 33.687347, "longitude": -118.292653, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:01:34Z", "latitude": 33.687857, "longitude": -118.292143, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:03:57Z", "latitude": 33.688367, "longitude": -118.291633, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:06:34Z", "latitude": 33.688878, "longitude": -118.291122, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:08:56Z", "latitude": 33.689388, "longitude": -118.290612, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:11:25Z", "latitude": 33.689898, "longitude": -118.290102, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:14:00Z", "latitude": 33.690408, "longitude": -118.289592, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:16:14Z", "latitude": 33.690918, "longitude": -118.289082, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:18:45Z", "latitude": 33.691429, "longitude": -118.288571, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:21:05Z", "latitude": 33.691939, "longitude": -118.288061, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:23:37Z", "latitude": 33.692449, "longitude": -118.287551, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:26:21Z", "latitude": 33.692959, "longitude": -118.287041, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:29:07Z", "latitude": 33.693469, "longitude": -118.286531, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:31:23Z", "latitude": 33.69398, "longitude": -118.28602, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:34:08Z", "latitude": 33.69449, "longitude": -118.28551, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.695, "longitude": -118.285, "speed_over_ground": 1.0, "course_over_ground": 39.8, "heading": 39.8}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 2,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-ever-forward",
      "mmsi": "563012345",
      "name": "EVER FORWARD",
      "vessel_type": "cargo",
      "flag_state": "Singapore",
      "length": 334.0,
      "beam": 48.2,
      "draft": 14.5,
      "imo": "9811000",
      "callsign": "9V2345",
      "destination": "LOS ANGELES",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.713, "longitude": -118.25, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:35:10Z", "latitude": 33.67, "longitude": -118.275, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:37:25Z", "latitude": 33.670878, "longitude": -118.27449, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:39:46Z", "latitude": 33.671755, "longitude": -118.27398, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:41:59Z", "latitude": 33.672633, "longitude": -118.273469, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:44:25Z", "latitude": 33.67351, "longitude": -118.272959, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:47:10Z", "latitude": 33.674388, "longitude": -118.272449, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:49:49Z", "latitude": 33.675265, "longitude": -118.271939, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:52:25Z", "latitude": 33.676143, "longitude": -118.271429, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:54:53Z", "latitude": 33.67702, "longitude": -118.270918, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:57:23Z", "latitude": 33.677898, "longitude": -118.270408, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-01T23:59:43Z", "latitude": 33.678776, "longitude": -118.269898, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:02:13Z", "latitude": 33.679653, "longitude": -118.269388, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:04:40Z", "latitude": 33.680531, "longitude": -118.268878, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:06:54Z", "latitude": 33.681408, "longitude": -118.268367, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:09:21Z", "latitude": 33.682286, "longitude": -118.267857, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:12:08Z", "latitude": 33.683163, "longitude": -118.267347, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:14:44Z", "latitude": 33.684041, "longitude": -118.266837, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:17:15Z", "latitude": 33.684918, "longitude": -118.266327, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:19:51Z", "latitude": 33.685796, "longitude": -118.265816, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:22:13Z", "latitude": 33.686673, "longitude": -118.265306, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:24:53Z", "latitude": 33.687551, "longitude": -118.264796, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:27:26Z", "latitude": 33.688429, "longitude": -118.264286, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:29:46Z", "latitude": 33.689306, "longitude": -118.263776, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:32:25Z", "latitude": 33.690184, "longitude": -118.263265, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:34:42Z", "latitude": 33.691061, "longitude": -118.262755, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:37:25Z", "latitude": 33.691939, "longitude": -118.262245, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:40:11Z", "latitude": 33.692816, "longitude": -118.261735, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:42:37Z", "latitude": 33.693694, "longitude": -118.261224, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:45:18Z", "latitude": 33.694571, "longitude": -118.260714, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:47:39Z", "latitude": 33.695449, "longitude": -118.260204, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:50:17Z", "latitude": 33.696327, "longitude": -118.259694, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:52:36Z", "latitude": 33.697204, "longitude": -118.259184, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:55:00Z", "latitude": 33.698082, "longitude": -118.258673, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T00:57:48Z", "latitude": 33.698959, "longitude": -118.258163, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:00:19Z", "latitude": 33.699837, "longitude": -118.257653, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:02:50Z", "latitude": 33.700714, "longitude": -118.257143, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:05:35Z", "latitude": 33.701592, "longitude": -118.256633, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:07:56Z", "latitude": 33.702469, "longitude": -118.256122, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:10:22Z", "latitude": 33.703347, "longitude": -118.255612, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:13:03Z", "latitude": 33.704224, "longitude": -118.255102, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:15:21Z", "latitude": 33.705102, "longitude": -118.254592, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:17:36Z", "latitude": 33.70598, "longitude": -118.254082, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:20:02Z", "latitude": 33.706857, "longitude": -118.253571, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:22:28Z", "latitude": 33.707735, "longitude": -118.253061, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:24:40Z", "latitude": 33.708612, "longitude": -118.252551, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:26:53Z", "latitude": 33.70949, "longitude": -118.252041, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:29:08Z", "latitude": 33.710367, "longitude": -118.251531, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:31:35Z", "latitude": 33.711245, "longitude": -118.25102, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:34:11Z", "latitude": 33.712122, "longitude": -118.25051, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.713, "longitude": -118.25, "speed_over_ground": 1.4, "course_over_ground": 25.8, "heading": 25.8}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 0,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-pacific-guardian",
      "mmsi": "636091234",
      "name": "PACIFIC GUARDIAN",
      "vessel_type": "tanker",
      "flag_state": "Liberia",
      "length": 183.0,
      "beam": 32.2,
      "draft": 11.0,
      "imo": "9765432",
      "callsign": "A8LB7",
      "destination": "LONG BEACH",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.711983, "longitude": -118.218024, "speed_over_ground": 0.13145, "course_over_ground": 250.834776, "heading": 114.807411},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": true,
      "is_resolved": false,
      "status_reason": "Stationary for 5 min",
      "positions": [
        {"timestamp": "2026-11-01T23:59:07Z", "latitude": 33.712284, "longitude": -118.217934, "speed_over_ground": 0.257388, "course_over_ground": 34.330261, "heading": 190.137307},
        {"timestamp": "2026-11-02T00:01:37Z", "latitude": 33.711543, "longitude": -118.218289, "speed_over_ground": 0.260435, "course_over_ground": 319.519551, "heading": 171.180104},
        {"timestamp": "2026-11-02T00:04:07Z", "latitude": 33.711547, "longitude": -118.218426, "speed_over_ground": 0.277675, "course_over_ground": 323.752194, "heading": 202.863551},
        {"timestamp": "2026-11-02T00:06:37Z", "latitude": 33.711533, "longitude": -118.217571, "speed_over_ground": 0.094345, "course_over_ground": 346.128908, "heading": 211.332997},
        {"timestamp": "2026-11-02T00:09:07Z", "latitude": 33.712252, "longitude": -118.217787, "speed_over_ground": 0.119489, "course_over_ground": 27.697497, "heading": 58.48209},
        {"timestamp": "2026-11-02T00:11:37Z", "latitude": 33.71174, "longitude": -118.217665, "speed_over_ground": 0.116747, "course_over_ground": 322.749276, "heading": 119.422742},
        {"timestamp": "2026-11-02T00:14:07Z", "latitude": 33.712256, "longitude": -118.21836, "speed_over_ground": 0.296543, "course_over_ground": 260.698885, "heading": 180.285427},
        {"timestamp": "2026-11-02T00:16:37Z", "latitude": 33.712474, "longitude": -118.218446, "speed_over_ground": 0.131126, "course_over_ground": 301.922877, "heading": 122.613389},
        {"timestamp": "2026-11-02T00:19:07Z", "latitude": 33.712269, "longitude": -118.217545, "speed_over_ground": 0.119011, "course_over_ground": 278.47977, "heading": 10.665237},
        {"timestamp": "2026-11-02T00:21:37Z", "latitude": 33.711773, "longitude": -118.217507, "speed_over_ground": 0.147181, "course_over_ground": 128.092031, "heading": 338.811424},
        {"timestamp": "2026-11-02T00:24:07Z", "latitude": 33.711932, "longitude": -118.21782, "speed_over_ground": 0.198202, "course_over_ground": 30.849882, "heading": 222.70172},
        {"timestamp": "2026-11-02T00:26:37Z", "latitude": 33.712298, "longitude": -118.217787, "speed_over_ground": 0.024611, "course_over_ground": 55.519547, "heading": 256.203776},
        {"timestamp": "2026-11-02T00:29:07Z", "latitude": 33.712134, "longitude": -118.21776, "speed_over_ground": 0.095003, "course_over_ground": 38.35833, "heading": 1.87028},
        {"timestamp": "2026-11-02T00:31:37Z", "latitude": 33.711808, "longitude": -118.21814, "speed_over_ground": 0.08093, "course_over_ground": 47.702522, "heading": 67.461042},
        {"timestamp": "2026-11-02T00:34:07Z", "latitude": 33.711949, "longitude": -118.217945, "speed_over_ground": 0.122413, "course_over_ground": 9.454285, "heading": 127.409143},
        {"timestamp": "2026-11-02T00:36:37Z", "latitude": 33.711593, "longitude": -118.217902, "speed_over_ground": 0.097329, "course_over_ground": 138.68565, "heading": 105.065046},
        {"timestamp": "2026-11-02T00:39:07Z", "latitude": 33.711888, "longitude": -118.218415, "speed_over_ground": 0.270341, "course_over_ground": 325.874727, "heading": 352.142303},
        {"timestamp": "2026-11-02T00:41:37Z", "latitude": 33.712072, "longitude": -118.21833, "speed_over_ground": 0.11422, "course_over_ground": 49.982421, "heading": 108.407256},
        {"timestamp": "2026-11-02T00:44:07Z", "latitude": 33.711993, "longitude": -118.218437, "speed_over_ground": 0.130403, "course_over_ground": 151.596842, "heading": 174.323273},
        {"timestamp": "2026-11-02T00:46:37Z", "latitude": 33.711577, "longitude": -118.218248, "speed_over_ground": 0.073977, "course_over_ground": 225.012128, "heading": 213.770303},
        {"timestamp": "2026-11-02T00:49:07Z", "latitude": 33.711696, "longitude": -118.218393, "speed_over_ground": 0.091397, "course_over_ground": 341.576446, "heading": 119.598198},
        {"timestamp": "2026-11-02T00:51:37Z", "latitude": 33.71212, "longitude": -118.217696, "speed_over_ground": 0.098863, "course_over_ground": 120.505041, "heading": 293.571169},
        {"timestamp": "2026-11-02T00:54:07Z", "latitude": 33.71236, "longitude": -118.217526, "speed_over_ground": 0.040837, "course_over_ground": 115.439456, "heading": 341.020412},
        {"timestamp": "2026-11-02T00:56:37Z", "latitude": 33.711701, "longitude": -118.218186, "speed_over_ground": 0.289372, "course_over_ground": 348.74108, "heading": 104.921335},
        {"timestamp": "2026-11-02T00:59:07Z", "latitude": 33.712195, "longitude": -118.218009, "speed_over_ground": 0.172764, "course_over_ground": 87.272747, "heading": 135.379909},
        {"timestamp": "2026-11-02T01:01:37Z", "latitude": 33.712316, "longitude": -118.218107, "speed_over_ground": 0.034166, "course_over_ground": 202.986183, "heading": 213.201732},
        {"timestamp": "2026-11-02T01:04:07Z", "latitude": 33.712046, "longitude": -118.217818, "speed_over_ground": 0.16503, "course_over_ground": 343.08166, "heading": 166.184},
        {"timestamp": "2026-11-02T01:06:37Z", "latitude": 33.712208, "longitude": -118.218062, "speed_over_ground": 0.087399, "course_over_ground": 249.420701, "heading": 294.827604},
        {"timestamp": "2026-11-02T01:09:07Z", "latitude": 33.712296, "longitude": -118.218091, "speed_over_ground": 0.149791, "course_over_ground": 228.000974, "heading": 87.12762},
        {"timestamp": "2026-11-02T01:11:37Z", "latitude": 33.712159, "longitude": -118.217785, "speed_over_ground": 0.236723, "course_over_ground": 26.627449, "heading": 356.652221},
        {"timestamp": "2026-11-02T01:14:07Z", "latitude": 33.711979, "longitude": -118.218099, "speed_over_ground": 0.151984, "course_over_ground": 331.341186, "heading": 249.015192},
        {"timestamp": "2026-11-02T01:16:37Z", "latitude": 33.712044, "longitude": -118.217709, "speed_over_ground": 0.107859, "course_over_ground": 322.380546, "heading": 193.286155},
        {"timestamp": "2026-11-02T01:19:07Z", "latitude": 33.712138, "longitude": -118.218415, "speed_over_ground": 0.230686, "course_over_ground": 236.736592, "heading": 127.803175},
        {"timestamp": "2026-11-02T01:21:37Z", "latitude": 33.712147, "longitude": -118.218456, "speed_over_ground": 0.295082, "course_over_ground": 243.889883, "heading": 143.862389},
        {"timestamp": "2026-11-02T01:24:07Z", "latitude": 33.712253, "longitude": -118.217534, "speed_over_ground": 0.129137, "course_over_ground": 3.797198, "heading": 93.145813},
        {"timestamp": "2026-11-02T01:26:37Z", "latitude": 33.712011, "longitude": -118.217981, "speed_over_ground": 0.174155, "course_over_ground": 207.084743, "heading": 160.480279},
        {"timestamp": "2026-11-02T01:29:07Z", "latitude": 33.711891, "longitude": -118.217728, "speed_over_ground": 0.176577, "course_over_ground": 180.167681, "heading": 124.18826},
        {"timestamp": "2026-11-02T01:31:37Z", "latitude": 33.711525, "longitude": -118.218395, "speed_over_ground": 0.124793, "course_over_ground": 346.222032, "heading": 41.784962},
        {"timestamp": "2026-11-02T01:34:07Z", "latitude": 33.712441, "longitude": -118.218358, "speed_over_ground": 0.093567, "course_over_ground": 163.919749, "heading": 74.472237},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.711983, "longitude": -118.218024, "speed_over_ground": 0.13145, "course_over_ground": 250.834776, "heading": 114.807411}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 0,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-port-valor",
      "mmsi": "367890123",
      "name": "PORT VALOR",
      "vessel_type": "tug",
      "flag_state": "United States",
      "length": 30.0,
      "beam": 10.0,
      "draft": 4.0,
      "imo": null,
      "callsign": "WDJ1234",
      "destination": "LA HARBOR",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.749488, "longitude": -118.274139, "speed_over_ground": 3.074147, "course_over_ground": 124.237029, "heading": 125.795702},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-02T00:11:37Z", "latitude": 33.74723, "longitude": -118.274302, "speed_over_ground": 0.405093, "course_over_ground": 356.005282, "heading": 358.96468},
        {"timestamp": "2026-11-02T00:14:07Z", "latitude": 33.749267, "longitude": -118.275537, "speed_over_ground": 2.657416, "course_over_ground": 28.542787, "heading": 22.031851},
        {"timestamp": "2026-11-02T00:16:37Z", "latitude": 33.74948, "longitude": -118.275389, "speed_over_ground": 4.239396, "course_over_ground": 43.202714, "heading": 41.303663},
        {"timestamp": "2026-11-02T00:19:07Z", "latitude": 33.748646, "longitude": -118.275547, "speed_over_ground": 4.561916, "course_over_ground": 68.689036, "heading": 70.971174},
        {"timestamp": "2026-11-02T00:21:37Z", "latitude": 33.748668, "longitude": -118.27386, "speed_over_ground": 4.368813, "course_over_ground": 93.946489, "heading": 88.062178},
        {"timestamp": "2026-11-02T00:24:07Z", "latitude": 33.747995, "longitude": -118.274706, "speed_over_ground": 0.404365, "course_over_ground": 130.04651, "heading": 137.486097},
        {"timestamp": "2026-11-02T00:26:37Z", "latitude": 33.748592, "longitude": -118.274109, "speed_over_ground": 3.30394, "course_over_ground": 143.739197, "heading": 150.991928},
        {"timestamp": "2026-11-02T00:29:07Z", "latitude": 33.748629, "longitude": -118.273197, "speed_over_ground": 4.556434, "course_over_ground": 175.5543, "heading": 177.294395},
        {"timestamp": "2026-11-02T00:31:37Z", "latitude": 33.748371, "longitude": -118.272765, "speed_over_ground": 5.382071, "course_over_ground": 196.958493, "heading": 201.07826},
        {"timestamp": "2026-11-02T00:34:07Z", "latitude": 33.747018, "longitude": -118.274229, "speed_over_ground": 4.457938, "course_over_ground": 220.948897, "heading": 213.30613},
        {"timestamp": "2026-11-02T00:36:37Z", "latitude": 33.748009, "longitude": -118.273712, "speed_over_ground": 0.091522, "course_over_ground": 246.1076, "heading": 244.472382},
        {"timestamp": "2026-11-02T00:39:07Z", "latitude": 33.746872, "longitude": -118.273793, "speed_over_ground": 3.53484, "course_over_ground": 267.757346, "heading": 271.626005},
        {"timestamp": "2026-11-02T00:41:37Z", "latitude": 33.747599, "longitude": -118.274445, "speed_over_ground": 5.999598, "course_over_ground": 302.905202, "heading": 295.711133},
        {"timestamp": "2026-11-02T00:44:07Z", "latitude": 33.746759, "longitude": -118.275009, "speed_over_ground": 3.804004, "course_over_ground": 321.2916, "heading": 311.483269},
        {"timestamp": "2026-11-02T00:46:37Z", "latitude": 33.748814, "longitude": -118.274942, "speed_over_ground": 5.260864, "course_over_ground": 342.730694, "heading": 342.630091},
        {"timestamp": "2026-11-02T00:49:07Z", "latitude": 33.748852, "longitude": -118.275082, "speed_over_ground": 0.207815, "course_over_ground": 18.693933, "heading": 10.347346},
        {"timestamp": "2026-11-02T00:51:37Z", "latitude": 33.748041, "longitude": -118.275394, "speed_over_ground": 5.044226, "course_over_ground": 30.617214, "heading": 31.369386},
        {"timestamp": "2026-11-02T00:54:07Z", "latitude": 33.7492, "longitude": -118.274229, "speed_over_ground": 3.829286, "course_over_ground": 58.36418, "heading": 59.358703},
        {"timestamp": "2026-11-02T00:56:37Z", "latitude": 33.749423, "longitude": -118.273807, "speed_over_ground": 2.456827, "course_over_ground": 82.26422, "heading": 79.601455},
        {"timestamp": "2026-11-02T00:59:07Z", "latitude": 33.749351, "longitude": -118.274003, "speed_over_ground": 2.166442, "course_over_ground": 121.452219, "heading": 131.247733},
        {"timestamp": "2026-11-02T01:01:37Z", "latitude": 33.749259, "longitude": -118.274193, "speed_over_ground": 0.415035, "course_over_ground": 132.048329, "heading": 142.034582},
        {"timestamp": "2026-11-02T01:04:07Z", "latitude": 33.749189, "longitude": -118.273642, "speed_over_ground": 3.394308, "course_over_ground": 163.994647, "heading": 173.873801},
        {"timestamp": "2026-11-02T01:06:37Z", "latitude": 33.748888, "longitude": -118.273245, "speed_over_ground": 2.947784, "course_over_ground": 195.512633, "heading": 192.52525},
        {"timestamp": "2026-11-02T01:09:07Z", "latitude": 33.74731, "longitude": -118.274239, "speed_over_ground": 4.531083, "course_over_ground": 219.215079, "heading": 213.347472},
        {"timestamp": "2026-11-02T01:11:37Z", "latitude": 33.747447, "longitude": -118.274183, "speed_over_ground": 2.237431, "course_over_ground": 234.138854, "heading": 234.914225},
        {"timestamp": "2026-11-02T01:14:07Z", "latitude": 33.747148, "longitude": -118.274503, "speed_over_ground": 0.352027, "course_over_ground": 261.473072, "heading": 268.633409},
        {"timestamp": "2026-11-02T01:16:37Z", "latitude": 33.746716, "longitude": -118.273469, "speed_over_ground": 4.717197, "course_over_ground": 299.709766, "heading": 305.423587},
        {"timestamp": "2026-11-02T01:19:07Z", "latitude": 33.748408, "longitude": -118.275454, "speed_over_ground": 5.969945, "course_over_ground": 323.375374, "heading": 330.69695},
        {"timestamp": "2026-11-02T01:21:37Z", "latitude": 33.748572, "longitude": -118.2744, "speed_over_ground": 4.845579, "course_over_ground": 334.993545, "heading": 338.518236},
        {"timestamp": "2026-11-02T01:24:07Z", "latitude": 33.747724, "longitude": -118.275247, "speed_over_ground": 4.309702, "course_over_ground": 4.789175, "heading": 3.829009},
        {"timestamp": "2026-11-02T01:26:37Z", "latitude": 33.747672, "longitude": -118.275014, "speed_over_ground": 0.440063, "course_over_ground": 32.672555, "heading": 28.237069},
        {"timestamp": "2026-11-02T01:29:07Z", "latitude": 33.749638, "longitude": -118.275196, "speed_over_ground": 3.476285, "course_over_ground": 63.726722, "heading": 53.776184},
        {"timestamp": "2026-11-02T01:31:37Z", "latitude": 33.749333, "longitude": -118.27461, "speed_over_ground": 4.930896, "course_over_ground": 85.482706, "heading": 88.765582},
        {"timestamp": "2026-11-02T01:34:07Z", "latitude": 33.748963, "longitude": -118.274732, "speed_over_ground": 2.253323, "course_over_ground": 102.164455, "heading": 100.757317},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.749488, "longitude": -118.274139, "speed_over_ground": 3.074147, "course_over_ground": 124.237029, "heading": 125.795702}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 0,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-maria-del-mar",
      "mmsi": "345678901",
      "name": "MARIA DEL MAR",
      "vessel_type": "fishing",
      "flag_state": "Mexico",
      "length": 22.0,
      "beam": 6.5,
      "draft": 2.8,
      "imo": null,
      "callsign": "XA9876",
      "destination": "ENSENADA",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.705, "longitude": -118.3, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:37:26Z", "latitude": 33.685, "longitude": -118.33, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:39:41Z", "latitude": 33.685408, "longitude": -118.329388, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:41:53Z", "latitude": 33.685816, "longitude": -118.328776, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:44:11Z", "latitude": 33.686224, "longitude": -118.328163, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:46:56Z", "latitude": 33.686633, "longitude": -118.327551, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:49:31Z", "latitude": 33.687041, "longitude": -118.326939, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:52:08Z", "latitude": 33.687449, "longitude": -118.326327, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:54:25Z", "latitude": 33.687857, "longitude": -118.325714, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:57:08Z", "latitude": 33.688265, "longitude": -118.325102, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-01T23:59:25Z", "latitude": 33.688673, "longitude": -118.32449, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:02:00Z", "latitude": 33.689082, "longitude": -118.323878, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:04:16Z", "latitude": 33.68949, "longitude": -118.323265, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:06:33Z", "latitude": 33.689898, "longitude": -118.322653, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:09:13Z", "latitude": 33.690306, "longitude": -118.322041, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:11:43Z", "latitude": 33.690714, "longitude": -118.321429, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:14:13Z", "latitude": 33.691122, "longitude": -118.320816, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:17:00Z", "latitude": 33.691531, "longitude": -118.320204, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:19:37Z", "latitude": 33.691939, "longitude": -118.319592, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:21:58Z", "latitude": 33.692347, "longitude": -118.31898, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:24:28Z", "latitude": 33.692755, "longitude": -118.318367, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:26:50Z", "latitude": 33.693163, "longitude": -118.317755, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:29:17Z", "latitude": 33.693571, "longitude": -118.317143, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:31:55Z", "latitude": 33.69398, "longitude": -118.316531, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:34:29Z", "latitude": 33.694388, "longitude": -118.315918, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:37:06Z", "latitude": 33.694796, "longitude": -118.315306, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:39:24Z", "latitude": 33.695204, "longitude": -118.314694, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:41:37Z", "latitude": 33.695612, "longitude": -118.314082, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:43:52Z", "latitude": 33.69602, "longitude": -118.313469, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:46:13Z", "latitude": 33.696429, "longitude": -118.312857, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:48:27Z", "latitude": 33.696837, "longitude": -118.312245, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:51:12Z", "latitude": 33.697245, "longitude": -118.311633, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:53:36Z", "latitude": 33.697653, "longitude": -118.31102, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:56:06Z", "latitude": 33.698061, "longitude": -118.310408, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T00:58:20Z", "latitude": 33.698469, "longitude": -118.309796, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:00:33Z", "latitude": 33.698878, "longitude": -118.309184, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:03:06Z", "latitude": 33.699286, "longitude": -118.308571, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:05:27Z", "latitude": 33.699694, "longitude": -118.307959, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:08:10Z", "latitude": 33.700102, "longitude": -118.307347, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:10:26Z", "latitude": 33.70051, "longitude": -118.306735, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:13:04Z", "latitude": 33.700918, "longitude": -118.306122, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:15:29Z", "latitude": 33.701327, "longitude": -118.30551, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:17:44Z", "latitude": 33.701735, "longitude": -118.304898, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:20:07Z", "latitude": 33.702143, "longitude": -118.304286, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:22:22Z", "latitude": 33.702551, "longitude": -118.303673, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:24:51Z", "latitude": 33.702959, "longitude": -118.303061, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:27:12Z", "latitude": 33.703367, "longitude": -118.302449, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:29:26Z", "latitude": 33.703776, "longitude": -118.301837, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:31:56Z", "latitude": 33.704184, "longitude": -118.301224, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:34:24Z", "latitude": 33.704592, "longitude": -118.300612, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.705, "longitude": -118.3, "speed_over_ground": 1.0, "course_over_ground": 51.3, "heading": 51.3}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 0,
      "last_inspection_date": null,
      "weather": null
    },
    {
      "id": "v-catalina-express",
      "mmsi": "367654321",
      "name": "CATALINA EXPRESS",
      "vessel_type": "passenger",
      "flag_state": "United States",
      "length": 46.0,
      "beam": 10.0,
      "draft": 2.2,
      "imo": null,
      "callsign": "WBZ5678",
      "destination": "AVALON",
      "latest_position": {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.665, "longitude": -118.315, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
      "risk_score": 0.0,
      "recommended_action": "ignore",
      "is_inactive": false,
      "is_resolved": false,
      "status_reason": null,
      "positions": [
        {"timestamp": "2026-11-01T23:32:43Z", "latitude": 33.72, "longitude": -118.28, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:34:57Z", "latitude": 33.718878, "longitude": -118.280714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:37:21Z", "latitude": 33.717755, "longitude": -118.281429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:39:47Z", "latitude": 33.716633, "longitude": -118.282143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:42:09Z", "latitude": 33.71551, "longitude": -118.282857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:44:36Z", "latitude": 33.714388, "longitude": -118.283571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:47:20Z", "latitude": 33.713265, "longitude": -118.284286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:50:00Z", "latitude": 33.712143, "longitude": -118.285, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:52:26Z", "latitude": 33.71102, "longitude": -118.285714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:54:40Z", "latitude": 33.709898, "longitude": -118.286429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:56:56Z", "latitude": 33.708776, "longitude": -118.287143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-01T23:59:44Z", "latitude": 33.707653, "longitude": -118.287857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:02:26Z", "latitude": 33.706531, "longitude": -118.288571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:04:39Z", "latitude": 33.705408, "longitude": -118.289286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:07:27Z", "latitude": 33.704286, "longitude": -118.29, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:09:47Z", "latitude": 33.703163, "longitude": -118.290714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:12:04Z", "latitude": 33.702041, "longitude": -118.291429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:14:37Z", "latitude": 33.700918, "longitude": -118.292143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:17:02Z", "latitude": 33.699796, "longitude": -118.292857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:19:20Z", "latitude": 33.698673, "longitude": -118.293571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:22:07Z", "latitude": 33.697551, "longitude": -118.294286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:24:25Z", "latitude": 33.696429, "longitude": -118.295, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:27:11Z", "latitude": 33.695306, "longitude": -118.295714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:29:57Z", "latitude": 33.694184, "longitude": -118.296429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:32:35Z", "latitude": 33.693061, "longitude": -118.297143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:35:13Z", "latitude": 33.691939, "longitude": -118.297857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:37:27Z", "latitude": 33.690816, "longitude": -118.298571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:40:14Z", "latitude": 33.689694, "longitude": -118.299286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:42:44Z", "latitude": 33.688571, "longitude": -118.3, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:45:26Z", "latitude": 33.687449, "longitude": -118.300714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:47:52Z", "latitude": 33.686327, "longitude": -118.301429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:50:26Z", "latitude": 33.685204, "longitude": -118.302143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:52:43Z", "latitude": 33.684082, "longitude": -118.302857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:55:22Z", "latitude": 33.682959, "longitude": -118.303571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T00:58:04Z", "latitude": 33.681837, "longitude": -118.304286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:00:37Z", "latitude": 33.680714, "longitude": -118.305, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:03:20Z", "latitude": 33.679592, "longitude": -118.305714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:05:51Z", "latitude": 33.678469, "longitude": -118.306429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:08:20Z", "latitude": 33.677347, "longitude": -118.307143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:10:35Z", "latitude": 33.676224, "longitude": -118.307857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:13:17Z", "latitude": 33.675102, "longitude": -118.308571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:16:01Z", "latitude": 33.67398, "longitude": -118.309286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:18:46Z", "latitude": 33.672857, "longitude": -118.31, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:21:04Z", "latitude": 33.671735, "longitude": -118.310714, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:23:51Z", "latitude": 33.670612, "longitude": -118.311429, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:26:36Z", "latitude": 33.66949, "longitude": -118.312143, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:28:58Z", "latitude": 33.668367, "longitude": -118.312857, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:31:25Z", "latitude": 33.667245, "longitude": -118.313571, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:34:11Z", "latitude": 33.666122, "longitude": -118.314286, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9},
        {"timestamp": "2026-11-02T01:36:37Z", "latitude": 33.665, "longitude": -118.315, "speed_over_ground": 1.8, "course_over_ground": 207.9, "heading": 207.9}
      ],
      "anomaly_signals": [],
      "explanation": null,
      "inspection_deficiencies": 0,
      "last_inspection_date": null,
      "weather": null
    }
  ],
  "alerts": [
    {
      "id": "demo-v-dark-optical-1",
      "vessel_id": "v-dark-optical-1",
      "vessel_name": "UNIDENTIFIED VESSEL (Optical)",
      "vessel_mmsi": "900000001",
      "created_at": "2026-11-02T01:36:37Z",
      "status": "active",
      "risk_score": 85.0,
      "recommended_action": "escalate",
      "explanation": "Unidentified vessel detected by optical computer vision (SeaPod edge node). No AIS transponder, no registered identity. Detected at 3.3 nm range, bearing 295\u00b0, moving at ~4.2 kt.",
      "anomaly_signals": [
        {
          "anomaly_type": "dark_ship_optical",
          "severity": 0.65,
          "description": "OPTICAL DARK SHIP DETECTION by SeaPod_Alpha. Unregistered vessel detected at range 3.3 nm, bearing 295\u00b0. No AIS transponder signal. Detection confidence: 50%. This vessel does not appear in any AIS database.",
          "details": {
            "source": "edge_node",
            "node_id": "SeaPod_Alpha",
            "raw_distance_m": 6112.0,
            "scaled_distance_nm": 3.3,
            "velocity_ms": 4.2,
            "heading_deg": 295,
            "confidence": 0.5,
            "stream_url": null
          }
        }
      ]
    },
    {
      "id": "demo-v-jade-star",
      "vessel_id": "v-jade-star",
      "vessel_name": "JADE STAR",
      "vessel_mmsi": "672301456",
      "created_at": "2026-11-02T01:36:37Z",
      "status": "active",
      "risk_score": 72.0,
      "recommended_action": "verify",
      "explanation": "AIS position data shows kinematic implausibility \u2014 2 position jumps exceeding physically possible vessel speed. Probable AIS spoofing or GPS manipulation. Verify actual position.",
      "anomaly_signals": [
        {
          "anomaly_type": "kinematic_implausibility",
          "severity": 0.55,
          "description": "2 impossible position jumps detected (max 50.0 nm in under 2 minutes). Vessel appeared to teleport between locations \u2014 strong indicator of AIS position spoofing or GPS manipulation.",
          "details": {
            "impossible_jumps": 2,
            "max_jump_nm": 50.0,
            "max_implied_speed_kt": 1500.0,
            "spoofing_confidence": "high"
          }
        }
      ]
    },
    {
      "id": "demo-v-dark-horizon",
      "vessel_id": "v-dark-horizon",
      "vessel_name": "MV DARK HORIZON",
      "vessel_mmsi": "538006789",
      "created_at": "2026-11-02T01:36:37Z",
      "status": "active",
      "risk_score": 100.0,
      "recommended_action": "escalate",
      "explanation": "MV DARK HORIZON exhibits 7 anomaly signals across identity, spatial, and behavioral dimensions. Vessel went dark twice before appearing inside APM Terminal Restricted Zone with sustained loitering. Sprinted at 14+ kt toward LNG terminal then lingered along its perimeter. No IMO, no callsign, no voyage plan, Marshall Islands flag. Recommend immediate USCG verification and potential boarding.",
      "anomaly_signals": [
        {
          "anomaly_type": "ais_gap",
          "severity": 0.88,
          "description": "Two AIS transmission gaps detected: 18 minutes (08:46\u201309:04 UTC) and 8 minutes (11:22\u201311:30 UTC). Vessel reappeared 2.1 nm from last known position after first gap \u2014 inside APM Terminal Restricted Zone. Gap duration and positional displacement exceed normal equipment failure patterns.",
          "details": {
            "gaps": [
              {
                "start": "2026-03-27T08:46:00Z",
                "end": "2026-03-27T09:04:00Z",
                "duration_min": 18,
                "displacement_nm": 2.1
              },
              {
                "start": "2026-03-27T11:22:00Z",
                "end": "2026-03-27T11:30:00Z",
                "duration_min": 8,
                "displacement_nm": 0.8
              }
            ],
            "total_gaps": 2,
            "max_gap_min": 18,
            "intentional_confidence": "high"
          }
        },
        {
          "anomaly_type": "geofence_breach",
          "severity": 0.92,
          "description": "Vessel entered APM Terminal Restricted Zone (gf-restricted-terminal) at 09:04 UTC and remained inside for approximately 50 minutes with loitering behavior. No port authority clearance on file. Additionally approached within 0.3 nm of LNG Terminal Security Zone perimeter at 10:18 UTC.",
          "details": {
            "breached_zones": [
              {
                "zone_id": "gf-restricted-terminal",
                "zone_name": "APM Terminal Restricted Zone",
                "severity": "high",
                "duration_min": 50
              },
              {
                "zone_id": "gf-security-zone-lng",
                "zone_name": "LNG Terminal Security Zone",
                "severity": "high",
                "approach_nm": 0.3
              }
            ],
            "clearance_verified": false
          }
        },
        {
          "anomaly_type": "loitering",
          "severity": 0.7,
          "description": "Loitering detected in restricted terminal zone: 25 position reports over 50 minutes within a 0.4 nm radius. Speed oscillated between 0\u20138 kt with no consistent heading \u2014 inconsistent with cargo operations or anchorage waiting.",
          "details": {
            "duration_min": 50,
            "radius_nm": 0.4,
            "position_count": 25,
            "avg_speed_kt": 2.3,
            "speed_variance": 6.8,
            "heading_variance_deg": 142
          }
        },
        {
          "anomaly_type": "route_deviation",
          "severity": 0.55,
          "description": "Vessel declared destination 'UNKNOWN' with no filed voyage plan. Track shows low correlation with standard LA Harbor approach routes. Course changed >90\u00b0 on 4 occasions.",
          "details": {
            "declared_destination": "UNKNOWN",
            "voyage_plan_filed": false,
            "course_changes_over_90deg": 4,
            "route_correlation_pct": 18
          }
        },
        {
          "anomaly_type": "type_mismatch",
          "severity": 0.85,
          "description": "Multiple identity red flags: IMO number missing (required for cargo vessels >300 GT), callsign not registered, flag state (Marshall Islands) on enhanced monitoring list. 4 inspection deficiencies from last PSC inspection (Jun 2025). MMSI 538006789 has no prior port calls in USCG database.",
          "details": {
            "missing_imo": true,
            "missing_callsign": true,
            "flag_state_risk": "elevated",
            "inspection_deficiencies": 4,
            "prior_port_calls": 0,
            "psc_detention_history": "unknown"
          }
        },
        {
          "anomaly_type": "zone_lingering",
          "severity": 0.78,
          "description": "Vessel lingered within 0.3 nm of LNG Terminal Security Zone for 50 minutes. Repeated slow passes along the perimeter suggest deliberate reconnaissance. Speed dropped to 0 kt on 4 occasions while oriented toward the terminal.",
          "details": {
            "zone_id": "gf-security-zone-lng",
            "zone_name": "LNG Terminal Security Zone",
            "linger_duration_min": 50,
            "min_distance_nm": 0.3,
            "dead_stops": 4,
            "perimeter_passes": 6
          }
        },
        {
          "anomaly_type": "speed_anomaly",
          "severity": 0.62,
          "description": "Abnormal speed profile: vessel accelerated to 14+ kt in restricted harbor zone (speed limit 8 kt) during sprint toward LNG terminal, then decelerated to near-zero within 3 minutes. Speed variance across track is 6.8 kt \u2014 3.2x the regional average for cargo vessels.",
          "details": {
            "max_speed_kt": 15.2,
            "zone_speed_limit_kt": 8,
            "speed_variance_kt": 6.8,
            "regional_avg_variance_kt": 2.1,
            "rapid_decel_events": 3
          }
        }
      ]
    }
  ],
  "geofences": [
    {
      "id": "gf-restricted-terminal",
      "name": "APM Terminal Restricted Zone",
      "zone_type": "restricted",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -118.272,
              33.748
            ],
            [
              -118.262,
              33.748
            ],
            [
              -118.262,
              33.755
            ],
            [
              -118.272,
              33.755
            ],
            [
              -118.272,
              33.748
            ]
          ]
        ]
      },
      "severity": "high",
      "description": "Restricted area around APM Terminals container operations"
    },
    {
      "id": "gf-main-channel",
      "name": "Main Channel",
      "zone_type": "shipping_lane",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -118.285,
              33.7
            ],
            [
              -118.25,
              33.7
            ],
            [
              -118.25,
              33.72
            ],
            [
              -118.285,
              33.72
            ],
            [
              -118.285,
              33.7
            ]
          ]
        ]
      },
      "severity": "medium",
      "description": "Primary shipping channel into LA/Long Beach port complex"
    },
    {
      "id": "gf-anchorage-a",
      "name": "Anchorage A",
      "zone_type": "anchorage",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -118.23,
              33.7
            ],
            [
              -118.21,
              33.7
            ],
            [
              -118.21,
              33.72
            ],
            [
              -118.23,
              33.72
            ],
            [
              -118.23,
              33.7
            ]
          ]
        ]
      },
      "severity": "low",
      "description": "Designated anchorage area for vessels awaiting berth"
    },
    {
      "id": "gf-security-zone-lng",
      "name": "LNG Terminal Security Zone",
      "zone_type": "security",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -118.24,
              33.74
            ],
            [
              -118.23,
              33.74
            ],
            [
              -118.23,
              33.75
            ],
            [
              -118.24,
              33.75
            ],
            [
              -118.24,
              33.74
            ]
          ]
        ]
      },
      "severity": "high",
      "description": "Security exclusion zone around LNG terminal"
    },
    {
      "id": "gf-environmental-preserve",
      "name": "Cabrillo Marine Preserve",
      "zone_type": "environmental",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -118.295,
              33.705
            ],
            [
              -118.288,
              33.705
            ],
            [
              -118.288,
              33.715
            ],
            [
              -118.295,
              33.715
            ],
            [
              -118.295,
              33.705
            ]
          ]
        ]
      },
      "severity": "medium",
      "description": "Environmental protection zone \u2014 restricted vessel operations"
    }
  ],
  "history": {
    "v-dark-horizon": [
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 43.1,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T22:36:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 48.3,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T22:51:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 56.9,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:06:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 61.4,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:21:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 66.6,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:36:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 72.2,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:51:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 76.9,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:06:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 80.1,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:21:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 83.0,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:36:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 88.9,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:51:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 95.0,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T01:06:37Z"
      },
      {
        "vessel_id": "v-dark-horizon",
        "risk_score": 97.8,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T01:21:37Z"
      }
    ],
    "v-jade-star": [
      {
        "vessel_id": "v-jade-star",
        "risk_score": 31.1,
        "recommended_action": "verify",
        "timestamp": "2026-11-01T22:36:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 35.9,
        "recommended_action": "verify",
        "timestamp": "2026-11-01T22:51:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 40.8,
        "recommended_action": "verify",
        "timestamp": "2026-11-01T23:06:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 40.8,
        "recommended_action": "verify",
        "timestamp": "2026-11-01T23:21:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 49.0,
        "recommended_action": "verify",
        "timestamp": "2026-11-01T23:36:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 48.2,
        "recommended_action": "verify",
        "timestamp": "2026-11-01T23:51:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 56.8,
        "recommended_action": "verify",
        "timestamp": "2026-11-02T00:06:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 57.3,
        "recommended_action": "verify",
        "timestamp": "2026-11-02T00:21:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 63.2,
        "recommended_action": "verify",
        "timestamp": "2026-11-02T00:36:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 63.4,
        "recommended_action": "verify",
        "timestamp": "2026-11-02T00:51:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 67.9,
        "recommended_action": "verify",
        "timestamp": "2026-11-02T01:06:37Z"
      },
      {
        "vessel_id": "v-jade-star",
        "risk_score": 72.9,
        "recommended_action": "verify",
        "timestamp": "2026-11-02T01:21:37Z"
      }
    ],
    "v-dark-optical-1": [
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 38.9,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T22:36:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 43.7,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T22:51:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 44.0,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:06:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 53.3,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:21:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 54.2,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:36:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 57.9,
        "recommended_action": "escalate",
        "timestamp": "2026-11-01T23:51:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 65.2,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:06:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 70.5,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:21:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 74.6,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:36:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 73.6,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T00:51:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 82.7,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T01:06:37Z"
      },
      {
        "vessel_id": "v-dark-optical-1",
        "risk_score": 83.8,
        "recommended_action": "escalate",
        "timestamp": "2026-11-02T01:21:37Z"
      }
    ],
    "v-aegean-voyager": [
      {
        "vessel_id": "v-aegean-voyager",
        "risk_score": 0.0,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-ocean-phantom": [
      {
        "vessel_id": "v-ocean-phantom",
        "risk_score": 4.2,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-northern-spirit": [
      {
        "vessel_id": "v-northern-spirit",
        "risk_score": 22.5,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-caspian-trader": [
      {
        "vessel_id": "v-caspian-trader",
        "risk_score": 30.2,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-ever-forward": [
      {
        "vessel_id": "v-ever-forward",
        "risk_score": 0.0,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-pacific-guardian": [
      {
        "vessel_id": "v-pacific-guardian",
        "risk_score": 0.0,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-port-valor": [
      {
        "vessel_id": "v-port-valor",
        "risk_score": 22.6,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-maria-del-mar": [
      {
        "vessel_id": "v-maria-del-mar",
        "risk_score": 0.0,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ],
    "v-catalina-express": [
      {
        "vessel_id": "v-catalina-express",
        "risk_score": 0.0,
        "recommended_action": "ignore",
        "timestamp": "2026-11-02T01:36:37Z"
      }
    ]
  }
};
