window.FitnessData = (() => {
  "use strict";

  const equipment = [
    ["barbell", "杠铃"],
    ["dumbbell", "哑铃"],
    ["kettlebell", "壶铃"],
    ["trap_bar", "六角杠/Trap Bar"],
    ["squat_rack", "深蹲架"],
    ["bench", "训练凳"],
    ["smith", "史密斯机"],
    ["cable", "龙门架/绳索"],
    ["lat_pulldown", "高位下拉"],
    ["seated_row_machine", "坐姿划船机"],
    ["leg_press", "腿举机"],
    ["hack_squat", "哈克深蹲机"],
    ["leg_extension", "腿屈伸机"],
    ["leg_curl", "腿弯举机"],
    ["calf_raise", "提踵机"],
    ["pec_deck", "夹胸机"],
    ["chest_press_machine", "推胸机"],
    ["shoulder_press_machine", "肩推机"],
    ["pullup_bar", "引体向上杆"],
    ["dip_station", "双杠"],
    ["assisted_pullup", "辅助引体/双杠机"],
    ["landmine", "地雷杆"],
    ["glute_drive", "臀推机"],
    ["hip_abduction", "髋外展机"],
    ["hip_adduction", "髋内收机"],
    ["preacher_bench", "牧师凳"],
    ["back_extension", "罗马椅/背伸凳"],
    ["ab_machine", "腹肌机"],
    ["bands", "弹力带"],
    ["suspension_trainer", "TRX/悬挂训练带"],
    ["mat", "瑜伽垫/空地"],
    ["treadmill", "跑步机"],
    ["elliptical", "椭圆机"],
    ["stair_climber", "爬楼机"],
    ["bike", "单车"],
    ["rower", "划船机"],
    ["sled", "雪橇推"]
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
    exercise("chest_press_machine", "推胸机", "水平推", ["胸", "肱三头肌"], ["chest_press_machine"], ["dumbbell_bench_press", "bench_press", "push_up"], "推起时肩胛保持稳定，肘部路径自然。", "重量过大时容易耸肩和肩前顶。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=chest+press+machine+form")
    ]),
    exercise("incline_dumbbell_press", "上斜哑铃卧推", "水平推", ["上胸", "肩前束", "肱三头肌"], ["dumbbell", "bench"], ["dumbbell_bench_press", "chest_press_machine"], "上斜角度不要过高，肩胛保持稳定。", "肩前侧不适时降低角度。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=incline+dumbbell+press+form")
    ]),
    exercise("dumbbell_shoulder_press", "哑铃肩推", "垂直推", ["肩", "肱三头肌"], ["dumbbell", "bench"], ["barbell_overhead_press", "lateral_raise"], "坐姿时背部贴稳，避免耸肩。", "肩不适时改小重量高次数。", [
      link("ExRx", "https://exrx.net/WeightExercises/DeltoidAnterior/DBShoulderPress")
    ]),
    exercise("barbell_overhead_press", "杠铃推举", "垂直推", ["肩", "肱三头肌", "核心"], ["barbell"], ["dumbbell_shoulder_press", "lateral_raise"], "核心收紧，杠铃路径贴近面部。", "肩痛或腰椎代偿时换哑铃坐姿推举。", [
      link("ExRx", "https://exrx.net/WeightExercises/DeltoidAnterior/BBMilitaryPress")
    ]),
    exercise("machine_shoulder_press", "器械肩推", "垂直推", ["肩", "肱三头肌"], ["shoulder_press_machine"], ["dumbbell_shoulder_press", "barbell_overhead_press"], "座椅高度让把手略低于肩。", "腰背不适时优先用机器稳定发力。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=machine+shoulder+press+form")
    ]),
    exercise("landmine_press", "地雷杆推举", "垂直推", ["肩", "上胸", "核心"], ["landmine", "barbell"], ["dumbbell_shoulder_press", "machine_shoulder_press"], "沿弧线向前上方推，核心保持稳定。", "适合肩不舒服但仍想保留推举模式时使用。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=landmine+press+form")
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
    exercise("assisted_pullup_machine", "辅助引体向上", "垂直拉", ["背阔肌", "肱二头肌"], ["assisted_pullup"], ["pull_up", "lat_pulldown", "band_pulldown"], "借助配重完成完整幅度，更容易专注肩胛控制。", "不要借助冲击完成向上。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=assisted+pull+up+machine+form")
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
    exercise("seated_row_machine", "坐姿划船机", "水平拉", ["背", "肱二头肌"], ["seated_row_machine"], ["seated_cable_row", "one_arm_dumbbell_row"], "胸口贴稳支撑，优先感受肩胛后缩。", "适合动作稳定性不够时使用。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=seated+row+machine+form")
    ]),
    exercise("chest_supported_row", "胸托划船", "水平拉", ["背", "后束", "肱二头肌"], ["dumbbell", "bench"], ["one_arm_dumbbell_row", "seated_row_machine", "seated_cable_row"], "胸口贴稳凳面，减少下背和借力。", "背部训练时如果小臂总先累，可优先选这个。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=chest+supported+row+form")
    ]),
    exercise("face_pull", "绳索面拉", "水平拉", ["后束", "上背", "肩胛"], ["cable"], ["rear_delt_fly"], "拉向眉眼高度，肘部外展，肩胛后缩。", "重量不宜过大，优先动作路径。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=face+pull+form")
    ]),
    exercise("rear_delt_fly", "后束飞鸟", "水平拉", ["后三角", "上背"], ["pec_deck"], ["face_pull", "band_row"], "肩胛稳定，肘部略弯，避免耸肩。", "适合作为拉类辅助动作。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=rear+delt+fly+form")
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
    exercise("cable_curl", "绳索弯举", "肘屈", ["肱二头肌"], ["cable"], ["dumbbell_curl", "preacher_curl"], "保持持续张力，肘部尽量固定。", "重量不宜过大，否则容易耸肩借力。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=cable+biceps+curl+form")
    ]),
    exercise("preacher_curl", "牧师凳弯举", "肘屈", ["肱二头肌"], ["preacher_bench", "dumbbell"], ["dumbbell_curl"], "上臂贴稳垫面，避免肩部代偿。", "底部不要完全卸力。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=preacher+curl+form")
    ]),
    exercise("triceps_pushdown", "绳索下压", "肘伸", ["肱三头肌"], ["cable"], ["overhead_triceps_extension"], "肘部固定在身体两侧，向下伸肘。", "不要用肩部下压代偿。", [
      link("ExRx", "https://exrx.net/WeightExercises/Triceps/CBPushdown")
    ]),
    exercise("dip", "双杠臂屈伸", "水平推", ["胸", "肱三头肌"], ["dip_station"], ["push_up", "chest_press_machine"], "肩胛下压，身体微前倾可更多刺激胸。", "肩前侧不适时谨慎使用。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=dip+proper+form")
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
    exercise("ab_crunch_machine", "腹肌机卷腹", "核心抗伸展", ["腹直肌"], ["ab_machine"], ["plank", "dead_bug"], "下压时保持腹部发力，不要只用髋屈肌。", "适合作为补充，不代替核心控制训练。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=ab+crunch+machine+form")
    ]),
    exercise("back_extension", "背伸", "髋铰链", ["竖脊肌", "臀", "腘绳肌"], ["back_extension"], ["glute_bridge", "dumbbell_rdl"], "躯干与下肢连成一体，动作由髋主导。", "下背不适时控制幅度。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=back+extension+exercise+form")
    ]),
    exercise("hack_squat_machine", "哈克深蹲", "蹲", ["股四头肌", "臀"], ["hack_squat"], ["barbell_squat", "leg_press", "smith_squat"], "脚位和下蹲深度根据膝髋舒适度调整。", "适合想减少躯干稳定要求时使用。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=hack+squat+machine+form")
    ]),
    exercise("trap_bar_deadlift", "六角杠硬拉", "髋铰链", ["臀", "腘绳肌", "股四头肌"], ["trap_bar"], ["barbell_deadlift", "dumbbell_rdl"], "重心更居中，适合兼顾腿和髋铰链发力。", "如果下背容易紧张，可以优先尝试。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=trap+bar+deadlift+form")
    ]),
    exercise("kettlebell_swing", "壶铃摆动", "髋铰链", ["臀", "腘绳肌", "心肺"], ["kettlebell"], ["dumbbell_rdl", "glute_bridge"], "靠髋伸展发力，不是手臂前抬。", "腰背不适或不会髋铰链时不建议一开始就加快。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=kettlebell+swing+form")
    ]),
    exercise("leg_extension_machine", "腿屈伸", "腿伸", ["股四头肌"], ["leg_extension"], ["leg_press", "goblet_squat"], "顶峰收缩 1 秒，慢速离心。", "膝不适时控制重量和幅度。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=leg+extension+machine+form")
    ]),
    exercise("seated_leg_curl", "腿弯举", "腿弯", ["腘绳肌"], ["leg_curl"], ["dumbbell_rdl", "glute_bridge"], "骨盆保持稳定，避免借力。", "适合作为硬拉类动作的补充。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=seated+leg+curl+form")
    ]),
    exercise("standing_calf_raise", "提踵", "小腿", ["小腿"], ["calf_raise"], ["treadmill_incline_walk"], "底部拉伸，顶部停顿，避免弹震。", "适合作为下肢辅助动作。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=calf+raise+machine+form")
    ]),
    exercise("glute_drive_machine", "臀推机", "髋伸展", ["臀", "腘绳肌"], ["glute_drive"], ["hip_thrust", "glute_bridge"], "顶峰专注臀部收缩，减少腰椎代偿。", "适合想稳定完成臀推模式时使用。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=glute+drive+machine+form")
    ]),
    exercise("hip_abduction_machine", "髋外展机", "髋外展", ["臀中肌", "臀小肌"], ["hip_abduction"], ["glute_bridge"], "骨盆稳定，避免身体大幅借力。", "适合作为膝稳定和臀中肌补充。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=hip+abduction+machine+form")
    ]),
    exercise("hip_adduction_machine", "髋内收机", "髋内收", ["内收肌"], ["hip_adduction"], ["goblet_squat"], "控制离心，骨盆稳定。", "更适合作为补充训练，不代替主动作。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=hip+adduction+machine+form")
    ]),
    exercise("treadmill_incline_walk", "跑步机坡度走", "有氧", ["心肺"], ["treadmill"], ["bike_easy", "rower_easy"], "中低强度，能完整说话但略喘。", "膝不适时降低坡度。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=treadmill+incline+walk+workout")
    ]),
    exercise("elliptical_easy", "椭圆机低强度有氧", "有氧", ["心肺"], ["elliptical"], ["treadmill_incline_walk", "bike_easy"], "保持可持续强度，避免一开始冲太快。", "适合膝冲击敏感时。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=elliptical+workout+low+intensity")
    ]),
    exercise("stair_climber_easy", "爬楼机低强度有氧", "有氧", ["心肺", "臀腿"], ["stair_climber"], ["treadmill_incline_walk", "bike_easy"], "保持均匀步频，不要全程扶手借力。", "下肢疲劳高时注意控制总时长。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=stair+climber+workout+form")
    ]),
    exercise("bike_easy", "单车低强度有氧", "有氧", ["心肺"], ["bike"], ["treadmill_incline_walk", "rower_easy"], "保持稳定踏频，强度可持续。", "适合下肢冲击敏感时。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=stationary+bike+zone+2+workout")
    ]),
    exercise("rower_easy", "划船机低强度有氧", "有氧", ["心肺", "背", "腿"], ["rower"], ["treadmill_incline_walk", "bike_easy"], "腿-髋-手顺序发力，回程慢。", "下背不适时谨慎。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=rowing+machine+proper+form")
    ]),
    exercise("sled_push", "雪橇推", "有氧", ["心肺", "臀腿"], ["sled"], ["stair_climber_easy", "treadmill_incline_walk"], "保持身体整体前倾，步频稳定。", "适合作为短时体能或减脂补充。", [
      link("YouTube 搜索", "https://www.youtube.com/results?search_query=sled+push+exercise+form")
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
