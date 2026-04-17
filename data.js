window.FitnessData = (() => {
  "use strict";

  const equipment = [
    ["barbell", "杠铃"],
    ["dumbbell", "哑铃"],
    ["squat_rack", "深蹲架"],
    ["bench", "训练凳"],
    ["smith", "史密斯机"],
    ["cable", "龙门架/绳索"],
    ["lat_pulldown", "高位下拉"],
    ["leg_press", "腿举机"],
    ["pec_deck", "夹胸机"],
    ["pullup_bar", "引体向上杆"],
    ["bands", "弹力带"],
    ["mat", "瑜伽垫/空地"],
    ["treadmill", "跑步机"],
    ["bike", "单车"],
    ["rower", "划船机"]
  ].map(([id, label]) => ({ id, label }));

  const link = (label, url) => ({ label, url });
  const exercise = (id, name, pattern, muscles, gear, substitutes, cue, risk, links) => ({
    id,
    name,
    pattern,
    muscles,
    equipment: gear,
    substitutes,
    cue,
    risk,
    links
  });

  const exercises = [
    exercise("barbell_squat", "杠铃深蹲", "蹲", ["股四头肌", "臀", "核心"], ["barbell", "squat_rack"], ["goblet_squat", "leg_press", "smith_squat"], "躯干稳定，膝盖与脚尖方向一致。", "膝痛明显时降低深度或换腿举/杯式深蹲。", [
      link("ExRx", "https://exrx.net/WeightExercises/Quadriceps/BBSquat"),
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=barbell+squat+proper+form")
    ]),
    exercise("goblet_squat", "哑铃杯式深蹲", "蹲", ["股四头肌", "臀"], ["dumbbell"], ["barbell_squat", "leg_press", "bulgarian_split_squat"], "哑铃贴近胸口，重心在脚中部。", "重量受限时可放慢离心或增加次数。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=goblet+squat+form")
    ]),
    exercise("leg_press", "腿举", "蹲", ["股四头肌", "臀"], ["leg_press"], ["goblet_squat", "barbell_squat"], "脚掌全程贴稳踏板，避免膝盖内扣。", "腰背不适时不要下放过深。", [
      link("ExRx", "https://exrx.net/WeightExercises/Quadriceps/SL45LegPress")
    ]),
    exercise("smith_squat", "史密斯深蹲", "蹲", ["股四头肌", "臀"], ["smith"], ["goblet_squat", "leg_press"], "脚位略向前，保持脊柱中立。", "不要为了深度牺牲骨盆稳定。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=smith+machine+squat+form")
    ]),
    exercise("bulgarian_split_squat", "保加利亚分腿蹲", "单腿", ["股四头肌", "臀"], ["dumbbell", "bench"], ["goblet_squat", "leg_press"], "前脚踩稳，身体略前倾。", "膝痛时缩小步幅或降低负重。", [
      link("ExRx", "https://exrx.net/WeightExercises/Quadriceps/DBSingleLegSplitSquat")
    ]),
    exercise("barbell_deadlift", "杠铃硬拉", "髋铰链", ["臀", "腘绳肌", "背"], ["barbell"], ["dumbbell_rdl", "hip_thrust", "glute_bridge"], "杠铃贴近小腿，髋和肩同步上升。", "下背不适时降低负荷或换臀桥/RDL。", [
      link("ExRx", "https://exrx.net/WeightExercises/ErectorSpinae/BBDeadlift")
    ]),
    exercise("dumbbell_rdl", "哑铃罗马尼亚硬拉", "髋铰链", ["腘绳肌", "臀"], ["dumbbell"], ["barbell_deadlift", "hip_thrust", "glute_bridge"], "膝微屈，髋向后坐，哑铃沿腿下放。", "不要用弓背换动作幅度。", [
      link("ExRx", "https://exrx.net/WeightExercises/Hamstrings/DBRomanianDeadlift")
    ]),
    exercise("hip_thrust", "杠铃臀推", "髋伸展", ["臀", "腘绳肌"], ["barbell", "bench"], ["glute_bridge", "dumbbell_rdl"], "顶峰收紧臀部，避免腰椎过伸。", "腰不舒服时降低重量或换地面臀桥。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=barbell+hip+thrust+form")
    ]),
    exercise("glute_bridge", "地面臀桥", "髋伸展", ["臀", "核心"], ["mat"], ["hip_thrust", "dumbbell_rdl"], "脚跟踩稳，顶峰停顿 1 秒。", "适合恢复日或器械受限时使用。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=glute+bridge+form")
    ]),
    exercise("bench_press", "杠铃卧推", "水平推", ["胸", "肱三头肌"], ["barbell", "bench"], ["dumbbell_bench_press", "push_up", "machine_chest_press"], "肩胛稳定，杠铃下放到胸部控制位置。", "肩痛时缩小幅度或换哑铃卧推。", [
      link("ExRx", "https://exrx.net/WeightExercises/PectoralSternal/BBBenchPress")
    ]),
    exercise("dumbbell_bench_press", "哑铃卧推", "水平推", ["胸", "肱三头肌"], ["dumbbell", "bench"], ["bench_press", "push_up"], "手腕中立，推起时不要碰撞。", "肩不适时改中立握或降低深度。", [
      link("ExRx", "https://exrx.net/WeightExercises/PectoralSternal/DBBenchPress")
    ]),
    exercise("push_up", "俯卧撑", "水平推", ["胸", "肱三头肌", "核心"], ["mat"], ["dumbbell_bench_press", "machine_chest_press"], "身体保持一条直线，胸部主动下沉。", "可用跪姿或垫高双手降低难度。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=push+up+proper+form")
    ]),
    exercise("machine_chest_press", "器械推胸", "水平推", ["胸", "肱三头肌"], ["pec_deck"], ["dumbbell_bench_press", "push_up"], "座椅高度让把手与胸中部接近。", "不要耸肩或弹震锁死。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=machine+chest+press+form")
    ]),
    exercise("dumbbell_shoulder_press", "哑铃肩推", "垂直推", ["肩", "肱三头肌"], ["dumbbell", "bench"], ["barbell_overhead_press", "lateral_raise"], "坐姿时背部贴稳，避免耸肩。", "肩不适时改小重量高次数。", [
      link("ExRx", "https://exrx.net/WeightExercises/DeltoidAnterior/DBShoulderPress")
    ]),
    exercise("barbell_overhead_press", "杠铃推举", "垂直推", ["肩", "肱三头肌", "核心"], ["barbell"], ["dumbbell_shoulder_press", "lateral_raise"], "核心收紧，杠铃路径贴近面部。", "肩痛或腰椎代偿时换哑铃坐姿推举。", [
      link("ExRx", "https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress")
    ]),
    exercise("lateral_raise", "哑铃侧平举", "肩外展", ["肩中束"], ["dumbbell"], ["cable_lateral_raise"], "手肘略弯，抬到肩高附近即可。", "不要用身体甩动借力。", [
      link("ExRx", "https://exrx.net/WeightExercises/DeltoidLateral/DBLateralRaise")
    ]),
    exercise("cable_lateral_raise", "绳索侧平举", "肩外展", ["肩中束"], ["cable"], ["lateral_raise"], "保持持续张力，动作慢放。", "重量不宜过大。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=cable+lateral+raise+form")
    ]),
    exercise("lat_pulldown", "高位下拉", "垂直拉", ["背阔肌", "肱二头肌"], ["lat_pulldown"], ["pull_up", "band_pulldown", "one_arm_dumbbell_row"], "先下沉肩胛，再把肘部向下拉。", "不要后仰过度变成划船。", [
      link("ExRx", "https://exrx.net/WeightExercises/LatissimusDorsi/CBFrontPulldown")
    ]),
    exercise("pull_up", "引体向上", "垂直拉", ["背阔肌", "肱二头肌"], ["pullup_bar"], ["lat_pulldown", "band_pulldown"], "全程控制肩胛，避免下放时完全松散。", "可用弹力带辅助。", [
      link("ExRx", "https://exrx.net/WeightExercises/LatissimusDorsi/BWPullup")
    ]),
    exercise("band_pulldown", "弹力带下拉", "垂直拉", ["背阔肌"], ["bands"], ["lat_pulldown", "pull_up"], "固定弹力带，保持背阔肌主动发力。", "适合居家或酒店简化版。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=resistance+band+lat+pulldown")
    ]),
    exercise("seated_cable_row", "坐姿绳索划船", "水平拉", ["背", "肱二头肌"], ["cable"], ["one_arm_dumbbell_row", "band_row"], "胸椎保持挺直，肘部向后拉。", "不要用腰部大幅后仰借力。", [
      link("ExRx", "https://exrx.net/WeightExercises/BackGeneral/CBSeatedRow")
    ]),
    exercise("one_arm_dumbbell_row", "单臂哑铃划船", "水平拉", ["背", "肱二头肌"], ["dumbbell", "bench"], ["seated_cable_row", "band_row"], "背部稳定，肘向髋部方向拉。", "避免扭腰借力。", [
      link("ExRx", "https://exrx.net/WeightExercises/BackGeneral/DBBentOverRow")
    ]),
    exercise("band_row", "弹力带划船", "水平拉", ["背"], ["bands"], ["seated_cable_row", "one_arm_dumbbell_row"], "肩胛先后缩，再拉动手臂。", "适合酒店或居家。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=resistance+band+row+form")
    ]),
    exercise("dumbbell_curl", "哑铃弯举", "肘屈", ["肱二头肌"], ["dumbbell"], ["cable_curl"], "上臂保持稳定，顶峰收缩。", "不要借助摆动完成。", [
      link("ExRx", "https://exrx.net/WeightExercises/Biceps/DBCurl")
    ]),
    exercise("triceps_pushdown", "绳索下压", "肘伸", ["肱三头肌"], ["cable"], ["overhead_triceps_extension"], "肘部固定在身体两侧，向下伸肘。", "不要用肩部下压代偿。", [
      link("ExRx", "https://exrx.net/WeightExercises/Triceps/CBPushdown")
    ]),
    exercise("overhead_triceps_extension", "哑铃过顶臂屈伸", "肘伸", ["肱三头肌"], ["dumbbell"], ["triceps_pushdown"], "肘部朝前，控制下放。", "肩不适时换绳索下压。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=dumbbell+overhead+triceps+extension+form")
    ]),
    exercise("plank", "平板支撑", "核心抗伸展", ["核心"], ["mat"], ["dead_bug"], "肋骨下沉，骨盆保持中立。", "腰酸时缩短单组时间。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=plank+proper+form")
    ]),
    exercise("dead_bug", "死虫", "核心抗伸展", ["核心"], ["mat"], ["plank"], "腰背贴近地面，四肢慢速交替。", "适合恢复日和核心控制。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=dead+bug+exercise+form")
    ]),
    exercise("treadmill_incline_walk", "跑步机坡度走", "有氧", ["心肺"], ["treadmill"], ["bike_easy", "rower_easy"], "中低强度，能完整说话但略喘。", "膝不适时降低坡度。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=treadmill+incline+walk+workout")
    ]),
    exercise("bike_easy", "单车低强度有氧", "有氧", ["心肺"], ["bike"], ["treadmill_incline_walk", "rower_easy"], "保持稳定踏频，强度可持续。", "适合下肢冲击敏感时。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=stationary+bike+zone+2+workout")
    ]),
    exercise("rower_easy", "划船机低强度有氧", "有氧", ["心肺", "背", "腿"], ["rower"], ["treadmill_incline_walk", "bike_easy"], "腿-髋-手顺序发力，回程慢。", "下背不适时谨慎。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=rowing+machine+proper+form")
    ])
  ];

  const defaultGyms = [
    {
      id: "gym_default",
      name: "默认健身房",
      location: "器械较完整的常用健身房",
      equipment: equipment.map((item) => item.id)
    },
    {
      id: "gym_hotel",
      name: "酒店健身房模板",
      location: "出差常见配置：哑铃、凳、龙门架、跑步机、垫子",
      equipment: ["dumbbell", "bench", "cable", "mat", "treadmill", "bike", "bands"]
    },
    {
      id: "gym_home",
      name: "居家/临时场地",
      location: "少器械：哑铃、弹力带、垫子",
      equipment: ["dumbbell", "bands", "mat"]
    }
  ];

  return { equipment, exercises, defaultGyms };
})();
