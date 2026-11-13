/* =====================================================================
 * main-workbench.js —— 一站式工作台（班主任工作台 my-sop-v3 -> "工作台" 页签）：scene-workbench
 * DOM / class / 文案 / 列定义 / 宽度逐字取自 /tmp/demo-spec/pages/dom-workbench-table.html
 * （其来源：my-sop-v3/index.vue、TabContainer.vue、components/Setting、Workbench.vue、StudentList.vue、components/pagination），
 * 并参照 /tmp/demo-spec/pages/_work/test-workbench.html 里已验证的渲染模板改成 Vue 组件。
 * 样式见 css/main-workbench.css（逐字取自 style-workbench-table.css）。
 *
 * 本场景选中"行课期"。三个期段各有一份 el-table（真实页面按 stageType 重建同一个 el-table），
 * 期段页签可切换（本地状态，不走父页面）。
 * 产品方案 v2 对本页的改动：浮层「教辅/课程」按课程类型分流——选到 AI 作文课时，页签条换成「学员列表」一个页签、
 * 班级下拉与齿轮不显示、下方内容区整体换成 <ai-panel>（见 main-ai.js）；素养课下页面保持原样。
 * 其余按钮/下拉项均为示意：$act('fake',{m:'示意：该功能本次不涉及'})。
 * 外壳（顶栏/侧栏/面包屑）由 app-shell 提供，这里只渲染内容区。
 * ===================================================================== */
(function () {
  /* 与真实项目 vue-loader 一致的空白处理（Vue CLI 4：whitespace:'condense'），同 main-shell.js */
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }

  var FAKE = '示意：该功能本次不涉及';

  /* ---------------------------------------------------------------
   * 虚构数据：三位学员（来自 ctx.D.STUDENTS），班级"三年级(2)班"；字段名为真实字段名
   * --------------------------------------------------------------- */
  var CLASS_NAME = '三年级(2)班';
  var EXTRA = {
    '12345': {
      nickname: '小张', desensitizePhone: '138****2345', userPhone: '13800002345',
      campCourseInfo: '领读：暑期阅读营', is1999User: 1, is2050User: 0, oldStu: 0,
      enterTime: '2026-10-12', relationType: 1, refundRiskLevel: '低', userPortrait: '外向、喜欢故事书', netHotspotTime: '20-21点',
      addWeComStatus: 1, assessmentReportStatus: 4, reportTime: '2026-10-15 20:11',
      firstConnStatus: 1, firstPassTime: '2026-10-13 19:30', firstConnContent: '按时完成首通', firstPassScore: '80',
      firstConnItems: [{ isDone: true, itemName: '加企微', itemScore: 20 }, { isDone: false, itemName: '填写调研', itemScore: 10 }],
      addressFillStatus: '1', latestFollow: '2026-11-04 电话沟通', latestFollowContent: '家长反馈孩子喜欢写作课，周末愿意参加加练',
      coreDemands: '提高作文成绩', renewIntention: 'A', firstRoundStatus: 1, firstRoundScore: '70',
      firstRoundItems: [{ isDone: 1, itemName: '第一轮电话', itemScore: 30 }, { isDone: 1, itemName: '第一轮企微', itemScore: 40 }],
      attendCnt: 5, effectiveAttendCnt: 4, finishLessonCnt: 4, playbackCnt: 1, homeworkSubmitCnt: 4, homeworkSiftedCnt: 1,
      homeworkFiveStarCnt: 1, homeworkFourStarCnt: 2, topicIssueCnt: 20, topicAnswerCnt: 18, topicAnswerRate: 90,
      topicAnswerCorrectCnt: 15, topicAnswerCorrectRate: 83.3, interactionCnt: 12, interactionJoinCnt: 10, interactionJoinRate: 83.3,
      stageReportCnt: 2, stageReportViewCnt: 1, askForLeaveCnt: 0, tempTransferCnt: 0,
      courseTimeName: '周六 10:00', isInClass: 1, isRenew: 0, latestOrderTime: '2026-10-12 09:31',
      trackMarkStatus: 1, latestTrackTime: '11-04 16:40', trackMarkList: [{ time: '11-04 16:40', status: '已跟进' }],
      scoreAdj: 76, midMeetingAttendDuration: '35分钟', isBuyWhileWatching: 0,
      fAttend: 'attend', fFinish: 'finish', fSubmit: 'submitted'
    },
    '23456': {
      nickname: '小李', desensitizePhone: '139****3456', userPhone: '13900003456',
      campCourseInfo: '', is1999User: 0, is2050User: 1, oldStu: 0,
      enterTime: '2026-10-13', relationType: 3, refundRiskLevel: '中', userPortrait: '内向、爱画画', netHotspotTime: '19-20点',
      addWeComStatus: 1, assessmentReportStatus: 1, reportTime: '',
      firstConnStatus: 2, firstPassTime: '2026-10-16 08:00', firstConnContent: '超时完成首通', firstPassScore: '60',
      firstConnItems: [{ isDone: true, itemName: '加企微', itemScore: 20 }, { isDone: true, itemName: '填写调研', itemScore: 10 }],
      addressFillStatus: '2', latestFollow: '2026-11-03 微信沟通', latestFollowContent: '',
      coreDemands: '培养阅读习惯', renewIntention: 'B', firstRoundStatus: 2, firstRoundScore: '55',
      firstRoundItems: [{ isDone: 1, itemName: '第一轮电话', itemScore: 30 }, { isDone: 0, itemName: '第一轮企微', itemScore: 40 }],
      attendCnt: 4, effectiveAttendCnt: 3, finishLessonCnt: 2, playbackCnt: 2, homeworkSubmitCnt: 3, homeworkSiftedCnt: 0,
      homeworkFiveStarCnt: 0, homeworkFourStarCnt: 1, topicIssueCnt: 20, topicAnswerCnt: 14, topicAnswerRate: 70,
      topicAnswerCorrectCnt: 9, topicAnswerCorrectRate: 64.3, interactionCnt: 12, interactionJoinCnt: 6, interactionJoinRate: 50,
      stageReportCnt: 1, stageReportViewCnt: 0, askForLeaveCnt: 1, tempTransferCnt: 0,
      courseTimeName: '周六 10:00', isInClass: 1, isRenew: 0, latestOrderTime: '2026-10-13 14:02',
      trackMarkStatus: 0, latestTrackTime: '', trackMarkList: [],
      scoreAdj: 52, midMeetingAttendDuration: '20分钟', isBuyWhileWatching: 1,
      fAttend: 'attend', fFinish: 'unfinish', fSubmit: 'submitted'
    },
    '34567': {
      nickname: '小王', desensitizePhone: '137****4567', userPhone: '13700004567',
      campCourseInfo: '', is1999User: 0, is2050User: 0, oldStu: 1,
      enterTime: '2026-10-14', relationType: 5, refundRiskLevel: '高', userPortrait: '好奇、爱提问', netHotspotTime: '21-22点',
      addWeComStatus: 0, assessmentReportStatus: 0, reportTime: '',
      firstConnStatus: 0, firstPassTime: '', firstConnContent: '', firstPassScore: '',
      firstConnItems: [],
      addressFillStatus: '0', latestFollow: '', latestFollowContent: '',
      coreDemands: '提升课堂表达', renewIntention: 'C', firstRoundStatus: 0, firstRoundScore: '',
      firstRoundItems: [],
      attendCnt: 2, effectiveAttendCnt: 1, finishLessonCnt: 1, playbackCnt: 0, homeworkSubmitCnt: 1, homeworkSiftedCnt: 0,
      homeworkFiveStarCnt: 0, homeworkFourStarCnt: 0, topicIssueCnt: 20, topicAnswerCnt: 6, topicAnswerRate: 30,
      topicAnswerCorrectCnt: 3, topicAnswerCorrectRate: 50, interactionCnt: 12, interactionJoinCnt: 2, interactionJoinRate: 16.7,
      stageReportCnt: 0, stageReportViewCnt: 0, askForLeaveCnt: 2, tempTransferCnt: 1,
      courseTimeName: '周日 14:00', isInClass: 1, isRenew: 1, latestOrderTime: '',
      trackMarkStatus: 3, latestTrackTime: '11-05 10:20', trackMarkList: [{ time: '11-02 15:10', status: '已跟进' }, { time: '11-05 10:20', status: '已续费' }],
      scoreAdj: null, midMeetingAttendDuration: '0分钟', isBuyWhileWatching: 0,
      fAttend: 'absent', fFinish: 'finish', fSubmit: 'unsubmitted'
    }
  };

  /* 数据目标卡片（POST /workbenches/targets/items 的 keyItemList 结构；count>0 才显示；taskFilterValue 对应 flag 过滤） */
  var BOARD = {
    receiveNew: [
      { dataName: '新生退费率', dataType: 'newStudentRefundRate', rate: 0, targetRate: 5, avgRate: 4.1,
        keyItemList: [{ taskFilterName: '高风险', count: 1, taskFilterValue: 'highRisk' }, { taskFilterName: '已退费', count: 0, taskFilterValue: '' }] },
      { dataName: '出勤率', dataType: 'attendanceRate', rate: 67, targetRate: 85, avgRate: 79,
        keyItemList: [{ taskFilterName: '已出勤', count: 2, taskFilterValue: 'attend' }, { taskFilterName: '未出勤', count: 1, taskFilterValue: 'absent' }] }
    ],
    inClass: [
      { dataName: '出勤率', dataType: 'attendanceRate', rate: 67, targetRate: 85, avgRate: 79,
        keyItemList: [{ taskFilterName: '已出勤', count: 2, taskFilterValue: 'attend' }, { taskFilterName: '未出勤', count: 1, taskFilterValue: 'absent' }] },
      { dataName: '完课率', dataType: 'completionRate', rate: 67, targetRate: 70, avgRate: 72,
        keyItemList: [{ taskFilterName: '已完课', count: 2, taskFilterValue: 'finish' }, { taskFilterName: '未完课', count: 1, taskFilterValue: 'unfinish' }] },
      { dataName: '作业提交率', dataType: 'homeworkSubmissionRate', rate: 67, targetRate: 60, avgRate: 58,
        keyItemList: [{ taskFilterName: '已提交', count: 2, taskFilterValue: 'submitted' }, { taskFilterName: '未提交', count: 1, taskFilterValue: 'unsubmitted' }] }
    ],
    renew: [
      { dataName: '续费率', dataType: 'renewalRate', rate: 33.3, targetRate: 40, avgRate: 38,
        keyItemList: [{ taskFilterName: '已续费', count: 1, taskFilterValue: 'renewed' }, { taskFilterName: '未续费', count: 2, taskFilterValue: 'notRenewed' }] }
    ]
  };

  /* keyItem 的 taskFilterValue -> 行过滤条件 */
  var FILTERS = {
    highRisk: function (r) { return r.refundRiskLevel === '高'; },
    attend: function (r) { return r.fAttend === 'attend'; },
    absent: function (r) { return r.fAttend === 'absent'; },
    finish: function (r) { return r.fFinish === 'finish'; },
    unfinish: function (r) { return r.fFinish === 'unfinish'; },
    submitted: function (r) { return r.fSubmit === 'submitted'; },
    unsubmitted: function (r) { return r.fSubmit === 'unsubmitted'; },
    renewed: function (r) { return r.isRenew === 1; },
    notRenewed: function (r) { return r.isRenew !== 1; }
  };

  /* 课节数据卡片（选中具体课节后显示；真实 7 张卡，结构同源 Workbench.vue .schedule-cards） */
  var SCHEDULES = [{ id: 's1', name: '第一单元' }, { id: 's2', name: '第二单元' }, { id: 's3', name: '第三单元' }];
  var SCHEDULE_CARDS = [
    { name: '出勤率', rate: 66.7, actions: [['已出勤', 2], ['未出勤', 1]] },
    { name: '有效出勤率', rate: 66.7, actions: [['有效出勤', 2], ['无效出勤', 1]] },
    { name: '完课率', rate: 66.7, actions: [['有效完课', 2], ['无效完课', 1]] },
    { name: '回放观看率', rate: 33.3, actions: [['已观看', 1], ['未观看', 2]] },
    { name: '临时调班', rate: null, text: '1人', actions: [['已开课', 0], ['未开课', 1], ['未临调', 2]] },
    { name: '请假', rate: 33.3, actions: [['请假', 1], ['未请假', 2]] },
    { name: '作业提交率', rate: 66.7, actions: [['已提交', 2], ['未提交', 1], ['精选', 1], ['5星', 1], ['4星', 1], ['未批改', 0]] }
  ];

  /* 全部筛选条件里的 10 组"数值范围"（label + el-input-number 最小值 至 最大值） */
  var RANGES = [
    ['出勤次数', 'attendCnt'], ['请假次数', 'askForLeaveCnt'], ['临时调班次数', 'tempTransferCnt'], ['查看回放次数', 'playbackCnt'],
    ['作业提交次数', 'homeworkSubmitCnt'], ['作业精选次数', 'homeworkSiftedCnt'], ['作业5星次数', 'homeworkFiveStarCnt'], ['作业4星次数', 'homeworkFourStarCnt']
  ];

  /* 浮层默认值：当前登录人对应的教辅 + 他名下的素养课 */
  function initialForm() {
    var D = (window.__ctx && window.__ctx.D) || {}, S = (window.__ctx && window.__ctx.S) || {};
    var me = S.me || 'wang', T = (D.TEACHERS || {})[me] || { ad: 'wang.lin' };
    var formal = me === 'li' ? 'formal4' : 'formal3';
    return { searchAD: T.ad, courseId: formal, classIds: [formal === 'formal4' ? 'k4' : 'k2'] };
  }

  function freshFilterForm() {
    var f = {
      enterTimeRange: [], relationTypes: [], refundRiskLevels: [], trackMarkStatus: [], isFinishAssessment: [], firstConnStatus: [],
      firstRoundStatus: [], renewIntentions: [], fillAddress: [], addWeCom: ''
    };
    RANGES.forEach(function (r) { f[r[1] + 'Min'] = undefined; f[r[1] + 'Max'] = undefined; });
    return f;
  }

  /* ---------------------------------------------------------------
   * 模板：DOM 逐字取自 dom-workbench-table.html（见 test-workbench.html）
   * --------------------------------------------------------------- */
  var STUDENT_COL =
    '<el-table-column label="学员" width="200" fixed="left">' +
      '<template slot-scope="scope">' +
        '<div class="student-info">' +
          '<div class="student-name">' +
            '<el-button type="text" @click="fake" style="padding: 0; margin-right: 4px; color: #303133;"> {{ scope.row.userName || scope.row.nickname || \'-\' }} </el-button>' +
            '<el-tooltip v-if="scope.row.campCourseInfo" placement="top">' +
              '<div slot="content">{{ scope.row.campCourseInfo || \'\' }}</div>' +
              '<span class="tag-leader">领</span>' +
            '</el-tooltip>' +
            '<el-tooltip v-if="scope.row.is1999User === 1" placement="top">' +
              '<div slot="content">1999用户</div>' +
              '<i class="el-icon-star-on star-1999"></i>' +
            '</el-tooltip>' +
            '<el-tooltip v-if="scope.row.is2050User === 1" placement="top">' +
              '<div slot="content">2050用户</div>' +
              '<i class="el-icon-star-on star-2050"></i>' +
            '</el-tooltip>' +
          '</div>' +
          '<div class="student-id">' +
            '<el-button type="text" @click="fake" style="padding: 0; margin-right: 4px;"> {{ scope.row.userId }} </el-button>' +
            '<i class="el-icon-document-copy copy-icon" style="cursor: pointer; color: #409EFF;" @click.stop="fake"></i>' +
          '</div>' +
          '<div class="student-phone">' +
            '<span style="cursor: pointer; color: #ff5f2e; margin-right: 4px;" @click="fake"> {{ formatPhone(scope.row) }} </span>' +
            '<i class="el-icon-document-copy copy-icon" style="cursor: pointer; color: #409EFF;" @click.stop="fake"></i>' +
          '</div>' +
        '</div>' +
      '</template>' +
    '</el-table-column>';

  var PORTRAIT_COL = '<el-table-column prop="userPortrait" label="预测用户画像" width="140" show-overflow-tooltip></el-table-column>';
  var NET_COL =
    '<el-table-column prop="netHotspotTime" label="预测上网时间" width="120">' +
      '<template slot="header">' +
        '<span>预测上网时间</span>' +
        '<el-tooltip placement="top-start">' +
          '<div slot="content">24小时制；0点为凌晨0点；12点为中午12点</div>' +
          '<i class="el-icon-info" style="margin-left: 4px;"></i>' +
        '</el-tooltip>' +
      '</template>' +
    '</el-table-column>';
  var RELATION_COL =
    '<el-table-column prop="relationType" label="学员类型" width="100">' +
      '<template slot-scope="scope"><span>{{ getUserRelationType(scope.row.relationType) }}</span></template>' +
    '</el-table-column>';
  var RISK_COL =
    '<el-table-column prop="refundRiskLevel" label="退费风险" width="100">' +
      '<template slot-scope="scope">' +
        '<el-button v-if="scope.row.refundRiskLevel" type="text" size="mini" @click="fake"> {{ scope.row.refundRiskLevel }} </el-button>' +
        '<span v-else>-</span>' +
      '</template>' +
    '</el-table-column>';
  var LATEST_FOLLOW_COL = function (label) {
    return '<el-table-column label="' + label + '" width="200">' +
      '<template slot-scope="scope">' +
        '<el-tooltip v-if="scope.row.latestFollowContent" placement="top" :content="scope.row.latestFollowContent">' +
          '<span>{{ scope.row.latestFollow }}</span>' +
        '</el-tooltip>' +
        '<span v-else>{{ scope.row.latestFollow }}</span>' +
      '</template>' +
    '</el-table-column>';
  };
  var FIRST_ROUND_STATUS_COL =
    '<el-table-column prop="firstRoundStatus" label="首轮状态" width="120">' +
      '<template slot-scope="scope"><span>{{ getFirstRoundStatusText(scope.row.firstRoundStatus) }}</span></template>' +
    '</el-table-column>';
  var FIRST_CONN_STATUS_COL =
    '<el-table-column prop="firstConnStatus" label="首通状态" width="120">' +
      '<template slot-scope="scope"><span>{{ getFirstConnStatusText(scope.row.firstConnStatus) }}</span></template>' +
    '</el-table-column>';
  var CORE_DEMANDS_COL = '<el-table-column prop="coreDemands" label="家长核心诉求" width="150" show-overflow-tooltip></el-table-column>';
  var TIP_HEADER = function (label, tip, margin) {
    return '<template slot="header">' +
      '<span>' + label + '</span>' +
      '<el-tooltip class="item" effect="dark" placement="top-start">' +
        '<template slot="content">' + tip + '</template>' +
        '<i class="el-icon-info" style="margin-' + margin + ': 5px;"></i>' +
      '</el-tooltip>' +
    '</template>';
  };
  var STAGE_REPORT_COL =
    '<el-table-column label="阶段报告" width="160">' +
      TIP_HEADER('阶段报告', '<span>家长查看量/报告生成量</span>', 'right') +
      '<template slot-scope="scope">' +
        '<template v-if="scope.row.stageReportCnt">' +
          '<el-button type="text" size="small" @click="fake">{{ scope.row.stageReportViewCnt || 0 }} / {{ scope.row.stageReportCnt || 0 }}</el-button>' +
        '</template>' +
        '<template v-else><span>0/0</span></template>' +
      '</template>' +
    '</el-table-column>';
  var RATE = function (prop, label, w) {
    return '<el-table-column prop="' + prop + '" label="' + label + '" width="' + w + '">' +
      '<template slot-scope="scope"><span>{{ formatRate(scope.row.' + prop + ') }}</span></template>' +
    '</el-table-column>';
  };
  /* 课节相关字段（selectedSchedule == 'all' 分支；选了具体课节时同样的列名/宽度，只是数据不同） */
  var LESSON_COLS =
    '<el-table-column prop="attendCnt" label="出勤次数" width="100"></el-table-column>' +
    '<el-table-column prop="effectiveAttendCnt" label="有效出勤次数" width="120"></el-table-column>' +
    '<el-table-column prop="finishLessonCnt" label="完课次数" width="100"></el-table-column>' +
    '<el-table-column prop="playbackCnt" label="查看回放次数" width="120"></el-table-column>' +
    '<el-table-column prop="homeworkSubmitCnt" label="作业提交次数" width="120"></el-table-column>' +
    '<el-table-column prop="homeworkSiftedCnt" label="作业精选次数" width="120"></el-table-column>' +
    '<el-table-column prop="homeworkFiveStarCnt" label="作业五星次数" width="120"></el-table-column>' +
    '<el-table-column prop="homeworkFourStarCnt" label="作业四星次数" width="120"></el-table-column>' +
    '<el-table-column prop="topicIssueCnt" label="课中题发题数" width="120"></el-table-column>' +
    '<el-table-column prop="topicAnswerCnt" label="课中题答题数" width="120"></el-table-column>' +
    RATE('topicAnswerRate', '课中题答题率', 120) +
    '<el-table-column prop="topicAnswerCorrectCnt" label="课中题答题正确数" width="140"></el-table-column>' +
    RATE('topicAnswerCorrectRate', '课中题答题正确率', 140) +
    '<el-table-column prop="interactionCnt" label="课中互动次数" width="120"></el-table-column>' +
    '<el-table-column prop="interactionJoinCnt" label="课中互动参与次数" width="140"></el-table-column>' +
    RATE('interactionJoinRate', '课中互动参与率', 140);

  var OP_DROPDOWN = function (items) {
    return '<el-dropdown trigger="click" @command="fakeCmd">' +
      '<el-button type="text" size="mini"> 其他<i class="el-icon-arrow-down el-icon--right"></i></el-button>' +
      '<el-dropdown-menu slot="dropdown">' + items + '</el-dropdown-menu>' +
    '</el-dropdown>';
  };
  var OTHER_ITEMS_IN = /* 行课期 / 续费期 */
    '<el-dropdown-item command="temporaryTransfer">临时调班</el-dropdown-item>' +
    '<el-dropdown-item command="leave">请假</el-dropdown-item>' +
    '<el-dropdown-item command="transferClass">转班</el-dropdown-item>' +
    '<el-dropdown-item command="retention">发起挽单</el-dropdown-item>' +
    '<el-dropdown-item command="refund">发起退款</el-dropdown-item>';
  var OTHER_ITEMS_NEW = /* 接新期 */
    '<el-dropdown-item command="taskExecution">任务执行</el-dropdown-item>' +
    '<el-dropdown-item command="transferClass">转班</el-dropdown-item>' +
    '<el-dropdown-item command="changeGrade">换年级换期</el-dropdown-item>' +
    '<el-dropdown-item command="temporaryTransfer">临时调班</el-dropdown-item>' +
    '<el-dropdown-item command="retention">发起挽单</el-dropdown-item>' +
    '<el-dropdown-item command="refund">发起退款</el-dropdown-item>';
  var OP_COL = function (inner) {
    return '<el-table-column label="操作" width="160" fixed="right" align="center">' +
      '<template slot-scope="scope"><div class="operation-buttons">' + inner + '</div></template>' +
    '</el-table-column>';
  };
  /* "作文批改" = 现有入口（无改动）：$act('openBench',{sid}) */
  var BTN_ESSAY = '<el-button type="text" size="mini" @click="openEssay(scope.row)"> 作文批改 </el-button>';
  var BTN_FOLLOW = '<el-button type="text" size="mini" @click="fake"> 添加跟进 </el-button>';
  var BTN_TASK = '<el-button type="text" size="mini" @click="fake"> 任务执行 </el-button>';

  var TABLE_ATTRS = ':stripe="true" :data="tableList" max-height="700px" :highlight-current-row="true" @selection-change="onSelection"';

  /* ---- 接新期 ---- */
  var TABLE_NEW =
    '<el-table v-if="stageType === \'receiveNew\'" key="student-table-receiveNew" ' + TABLE_ATTRS + '>' +
      '<el-table-column type="selection" width="55" fixed="left"></el-table-column>' +
      STUDENT_COL +
      '<el-table-column prop="className" label="班级" width="160"></el-table-column>' +
      '<el-table-column prop="enterTime" label="进班时间" width="120"></el-table-column>' +
      RELATION_COL + RISK_COL + PORTRAIT_COL + NET_COL +
      '<el-table-column prop="addWeComStatus" label="添加企微" width="100">' +
        '<template slot-scope="scope">' +
          '<span :style="{color: scope.row.addWeComStatus == 1 ? \'green\' : \'red\'}"> {{ scope.row.addWeComStatus == 1 ? \'是\' : \'否\' }} </span>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column prop="assessmentReportStatus" label="能力测评状态" width="170" align="center">' +
        '<template slot-scope="scope">' +
          '<div style="line-height: 1.6;">' +
            '<div>{{ getAbilityTestStatusText(scope.row.assessmentReportStatus) }}</div>' +
            '<template v-if="canViewAssessmentReport(scope.row.assessmentReportStatus)">' +
              '<div v-if="scope.row.reportTime" style="font-size: 12px; color: #909399;">{{ scope.row.reportTime }}</div>' +
              '<el-button type="text" size="small" style="padding: 0;" @click="fake">测评报告</el-button>' +
            '</template>' +
          '</div>' +
        '</template>' +
      '</el-table-column>' +
      FIRST_CONN_STATUS_COL +
      '<el-table-column prop="firstPassTime" label="首通完成时间" width="120">' +
        '<template slot-scope="scope">' +
          '<el-tooltip :disabled="!scope.row.firstConnContent" class="item" effect="dark" placement="top" :popper-class="\'custom-tooltip\'">' +
            '<template slot="content">{{ scope.row.firstConnContent }}</template>' +
            '<div><span>{{ scope.row.firstPassTime || \'未完成\' }}</span></div>' +
          '</el-tooltip>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column prop="firstPassScore" label="首通分数" width="100">' +
        '<template slot-scope="scope">' +
          '<template v-if="scope.row.firstPassScore">' +
            '<el-tooltip :disabled="scope.row.firstPassScore == \'-\' || scope.row.firstPassScore == null" class="firstPassScore-item" effect="dark" placement="top-start" :open-delay="300">' +
              '<template slot="content">' +
                '<div class="first-pass-detail">' +
                  '<div v-for="(item, index) in scope.row.firstConnItems" :key="index" class="detail-item">' +
                    '<div class="item-row">' +
                      '<span class="pass-status">{{ item.isDone ? \'✅\' : \'⭕️\' }}</span>' +
                      '<div class="event-names" :style="{color: item.isDone ? \'#00c32e\' : \'#fff\'}">{{ item.itemName }}</div>' +
                      '<span class="score" :style="{color: item.isDone ? \'#00c32e\' : \'#fff\'}">{{ item.itemScore }}分</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</template>' +
              '<span>{{ scope.row.firstPassScore }}</span>' +
            '</el-tooltip>' +
          '</template>' +
          '<template v-else><span>--</span></template>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column prop="addressFillStatus" label="收货地址" width="120">' +
        '<template slot-scope="scope">' +
          '<el-button type="text" v-if="scope.row.addressFillStatus == \'0\' || scope.row.addressFillStatus == \'2\'" size="mini" @click="fake"> {{ getAddressFillStatusText(scope.row.addressFillStatus) }} </el-button>' +
          '<span v-else>{{ getAddressFillStatusText(scope.row.addressFillStatus) }}</span>' +
        '</template>' +
      '</el-table-column>' +
      LATEST_FOLLOW_COL('最新跟进') +
      OP_COL(
        '<el-button type="text" size="mini" :disabled="scope.row.oldStu == 1" @click="fake"> 体验课数据 </el-button>' +
        BTN_ESSAY + BTN_FOLLOW + OP_DROPDOWN(OTHER_ITEMS_NEW)
      ) +
    '</el-table>';

  /* ---- 行课期 ---- */
  var TABLE_IN =
    '<el-table v-else-if="stageType === \'inClass\'" key="student-table-inClass" ' + TABLE_ATTRS + '>' +
      '<el-table-column type="selection" width="55" fixed="left"></el-table-column>' +
      STUDENT_COL +
      '<el-table-column prop="className" label="班级" width="160"></el-table-column>' +
      RELATION_COL + RISK_COL + PORTRAIT_COL + NET_COL + CORE_DEMANDS_COL +
      '<el-table-column prop="renewIntention" label="续费意向" width="120"></el-table-column>' +
      FIRST_ROUND_STATUS_COL +
      '<el-table-column prop="firstRoundScore" label="首轮分数" width="160">' +
        '<template slot-scope="scope">' +
          '<template v-if="scope.row.firstRoundScore">' +
            '<el-tooltip placement="top">' +
              '<div slot="content">' +
                '<div class="first-pass-detail">' +
                  '<div v-for="(item, index) in scope.row.firstRoundItems" :key="index" class="detail-item">' +
                    '<div class="item-row">' +
                      '<span class="pass-status">{{ item.isDone === 1 ? \'✅\' : \'⭕️\' }}</span>' +
                      '<div class="event-names" :style="{color: item.isDone === 1 ? \'#00c32e\' : \'#fff\'}">{{ item.itemName }}</div>' +
                      '<span class="score" :style="{color: item.isDone === 1 ? \'#00c32e\' : \'#fff\'}">{{ item.itemScore }}分</span>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<span>{{ scope.row.firstRoundScore }}</span>' +
            '</el-tooltip>' +
          '</template>' +
          '<template v-else><span>--</span></template>' +
        '</template>' +
      '</el-table-column>' +
      LATEST_FOLLOW_COL('最近跟进') +
      LESSON_COLS +
      STAGE_REPORT_COL +
      '<el-table-column prop="askForLeaveCnt" label="请假次数" width="100"></el-table-column>' +
      '<el-table-column prop="tempTransferCnt" label="临时调班次数" width="120"></el-table-column>' +
      OP_COL(BTN_FOLLOW + BTN_ESSAY + BTN_TASK + OP_DROPDOWN(OTHER_ITEMS_IN)) +
    '</el-table>';

  /* ---- 续费期 ---- */
  var TABLE_RENEW =
    '<el-table v-else key="student-table-renew" ' + TABLE_ATTRS + '>' +
      '<el-table-column type="selection" width="55" fixed="left"></el-table-column>' +
      STUDENT_COL +
      '<el-table-column prop="className" label="班级" width="160"></el-table-column>' +
      RELATION_COL + RISK_COL + FIRST_CONN_STATUS_COL + FIRST_ROUND_STATUS_COL + PORTRAIT_COL + NET_COL +
      '<el-table-column prop="courseTimeName" label="时段名称" width="120"></el-table-column>' +
      '<el-table-column prop="isInClass" label="是否在班" width="100">' +
        '<template slot-scope="scope"><span>{{ scope.row.isInClass === \'1\' || scope.row.isInClass === 1 ? \'是\' : \'否\' }}</span></template>' +
      '</el-table-column>' +
      CORE_DEMANDS_COL +
      '<el-table-column prop="isRenew" label="是否续费" width="100">' +
        '<template slot-scope="scope"><span>{{ scope.row.isRenew === 1 ? \'是\' : \'否\' }}</span></template>' +
      '</el-table-column>' +
      '<el-table-column prop="renewIntention" label="续费意向" width="120"></el-table-column>' +
      '<el-table-column prop="latestOrderTime" label="最近一次下单时间" width="180">' +
        '<template slot-scope="scope">' +
          '<el-tooltip v-if="scope.row.latestOrderTime" :content="scope.row.latestOrderTime" placement="top">' +
            '<el-button type="text" class="latest-order-time-btn" @click="fake"> {{ scope.row.latestOrderTime }} </el-button>' +
          '</el-tooltip>' +
          '<span v-else>--</span>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column prop="trackMarkStatus" label="跟进状态/最近时间" width="180">' +
        '<template slot-scope="scope">' +
          '<el-select v-model="scope.row.trackMarkStatus" :disabled="!!scope.row.isRenew" size="small">' +
            '<el-option label="待跟进" :value="0"></el-option>' +
            '<el-option label="已跟进" :value="1"></el-option>' +
            '<el-option label="不续费" :value="2"></el-option>' +
            '<el-option label="已续费" :value="3"></el-option>' +
          '</el-select>' +
          '<el-tooltip v-if="scope.row.latestTrackTime" placement="top">' +
            '<template slot="content">' +
              '<div>共{{ scope.row.trackMarkList.length }}次跟进</div>' +
              '<ol><li v-for="(item, index) in scope.row.trackMarkList" :key="index"><div>{{ item.time }} {{ item.status }}</div></li></ol>' +
            '</template>' +
            '<span style="font-size: 12px; color: #999;">最近：{{ scope.row.latestTrackTime || \'--\' }}</span>' +
          '</el-tooltip>' +
          '<span v-else style="font-size: 12px; color: #999;">最近：--</span>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column prop="scoreAdj" label="续费可能性" width="120">' +
        TIP_HEADER('续费可能性', '<div>点击查看续费建议</div>', 'right') +
        '<template slot-scope="scope">' +
          '<span v-if="scope.row.scoreAdj !== null && scope.row.scoreAdj !== undefined && scope.row.scoreAdj !== \'\'" style="cursor: pointer; color: #409EFF;" @click="fake"> {{ scope.row.scoreAdj }}% </span>' +
          '<span v-else>--</span>' +
        '</template>' +
      '</el-table-column>' +
      '<el-table-column prop="addressFillStatus" label="填写地址" width="120">' +
        '<template slot-scope="scope">' +
          '<el-button v-if="scope.row.addressFillStatus !== \'1\'" :type="scope.row.addressFillStatus === \'0\' ? \'warning\' : scope.row.addressFillStatus === \'2\' ? \'primary\' : \'info\'" size="mini" @click="fake"> {{ getAddressFillStatusText(scope.row.addressFillStatus) }} </el-button>' +
          '<span v-else>{{ getAddressFillStatusText(scope.row.addressFillStatus) }}</span>' +
        '</template>' +
      '</el-table-column>' +
      LATEST_FOLLOW_COL('最近跟进') +
      STAGE_REPORT_COL +
      LESSON_COLS +
      '<el-table-column prop="askForLeaveCnt" label="请假次数" width="100"></el-table-column>' +
      '<el-table-column prop="tempTransferCnt" label="临时调班次数" width="120"></el-table-column>' +
      '<el-table-column prop="midMeetingAttendDuration" label="期中班会出席时长" width="140"></el-table-column>' +
      '<el-table-column prop="isBuyWhileWatching" label="是否边看边买" width="120">' +
        '<template slot-scope="scope"><span>{{ scope.row.isBuyWhileWatching === 1 ? \'是\' : \'否\' }}</span></template>' +
      '</el-table-column>' +
      OP_COL(BTN_FOLLOW + BTN_ESSAY + BTN_TASK + OP_DROPDOWN(OTHER_ITEMS_IN)) +
    '</el-table>';

  var TEMPLATE =
  '<div class="my-sop-v3-container">' +

    /* ===== A. 顶部页签条（index.vue）：position:fixed; top:60px；left 随侧栏展开 205 / 收起 65 ===== */
    '<div class="header-row" :style="{ left: menuLeft + \'px\' }">' +
      '<div class="tabs-col">' +
        '<el-tabs v-if="!isAi" v-model="currentTabName" :before-leave="onHeaderTabLeave">' +
          '<el-tab-pane v-for="item in fixedTabList" :key="item.name" :label="item.title" :name="item.name" :closable="false"></el-tab-pane>' +
        '</el-tabs>' +
        /* 新增（产品方案 v2）：选到 AI 作文课时，7 个页签换成一个「学员列表」页签 */
        '<el-tabs v-else v-model="aiTab" @tab-remove="closeRec">' +
          '<el-tab-pane v-for="item in aiTabList" :key="item.name" :label="item.title" :name="item.name" :closable="item.name !== \'list\'"></el-tab-pane>' +
        '</el-tabs>' +
      '</div>' +
      '<div class="filter-col">' +
        '<el-popover placement="bottom-end" width="400" trigger="click" v-model="filterPopoverVisible" popper-class="filter-popover">' +
          '<div class="filter-panel">' +
            '<div class="filter-panel-item">' +
              '<span class="filter-label">教辅：</span>' +
              '<el-select v-model="formInline.searchAD" filterable placeholder="请选择教辅" size="small" style="width: 100%;">' +
                '<el-option v-for="item in adList" :key="item.teacherAd" :label="item.teacherName + \'-\' + item.teacherAd" :value="item.teacherAd"></el-option>' +
              '</el-select>' +
            '</div>' +
            '<div v-if="formInline.searchAD" class="filter-panel-item">' +
              '<span class="filter-label">课程：</span>' +
              '<el-select v-model="formInline.courseId" filterable placeholder="请选择课程" size="small" style="width: 100%;">' +
                '<el-option v-for="item in courseList" :key="item.courseId" :label="item.courseTitle" :value="item.courseId">' +
                  '<span>{{ item.courseTitle }}</span>' +
                  '<el-tag v-if="item.isAi" size="mini" class="x-wb-ai-tag">AI作文课</el-tag>' +
                '</el-option>' +
              '</el-select>' +
            '</div>' +
            '<div v-if="formInline.searchAD" class="filter-panel-item">' +
              '<span class="filter-label">班级：</span>' +
              '<el-select v-model="formInline.classIds" multiple collapse-tags filterable placeholder="请选择班级" size="small" style="width: 100%;" @change="onClassChange">' +
                '<el-option v-for="item in classList" :key="item.classIdStr" :label="item.className" :value="item.classIdStr"></el-option>' +
              '</el-select>' +
            '</div>' +
          '</div>' +
          '<div slot="reference" class="filter-trigger">' +
            '<i class="el-icon-s-operation filter-icon"></i>' +
            '<span class="filter-text">{{ selectedAdName }}</span>' +
            '<span v-if="hasFilter" class="filter-badge"></span>' +
          '</div>' +
        '</el-popover>' +
        /* Setting（components/Setting/index.vue） */
        '<div v-if="!isAi" class="setting">' +
          '<el-dropdown size="small" trigger="click" placement="bottom-end" @command="fakeCmd" @visible-change="function (v) { dropdownVisible = v }">' +
            '<i class="el-icon-s-tools setting-icon" :class="{ \'is-active\': dropdownVisible }"></i>' +
            '<el-dropdown-menu slot="dropdown" class="sop-setting-dropdown">' +
              '<el-dropdown-item command="lessonStatus">课中情况</el-dropdown-item>' +
              '<el-dropdown-item command="homeworkSubmit">作业提交</el-dropdown-item>' +
              '<el-dropdown-item command="changeRecord">更换记录</el-dropdown-item>' +
              '<el-dropdown-item command="refundRecord">退款记录</el-dropdown-item>' +
            '</el-dropdown-menu>' +
          '</el-dropdown>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* ===== B. Tab 内容容器 -> Workbench.vue（workbench-container tab-content） ===== */
    '<div class="tab-container-wrapper"><div>' +
      /* 新增（产品方案 v2）：AI 作文课时整体换成 AI 作文课工作台；换教辅/课程用 :key 重建（回到「学员列表」、筛选重置） */
      '<ai-panel ref="aiPanel" v-if="isAi" v-show="aiTab === \'list\'" :key="formInline.searchAD + \'|\' + formInline.courseId" :course-key="formInline.courseId" :viewer="viewerKey" :class-ids="formInline.classIds" @open-student="openRec" @open-summary="openSummary" @open-wechat="openWechatBatch"></ai-panel>' +
      /* 新增：点学员姓名 / ID 开「学员档案」灵活页签（沿用现有；原型只示意页签与头部信息） */
      '<template v-if="isAi"><div v-for="r in aiRecs" v-show="aiTab === r.name" :key="r.name">' +
      '<student-summary v-if="r.kind === \'summary\'" :row="r.row" :viewer="viewerKey" :entry="sumStore[r.key]" @send="openWechat"></student-summary>' +
      '<wechat-send-page v-else-if="r.kind === \'wechat\'" :student="r.student" :students="r.students" :task-kind="r.taskKind" :content="r.content" :mode="r.mode" :filter-text="r.filterText" :templates="r.templates" :def-type="r.defType" @cancel="closeRec(r.name)" @submit="onWechatSubmit(r, $event)"></wechat-send-page>' +
      '<student-record v-else :row="r"></student-record>' +
      '</div></template>' +
      '<div v-else class="workbench-container tab-content">' +

        /* 期段 tabs + 刷新按钮 */
        '<div style="position: relative;top: 5px;">' +
          '<el-tabs v-model="stageType" @tab-click="onStageClick">' +
            '<el-tab-pane v-for="item in serviceStageList" :key="item.tabId" :label="item.tabName" :name="item.tabId"></el-tab-pane>' +
          '</el-tabs>' +
          '<el-button style="position: absolute; top: 0px; right: 0;" type="primary" size="small" icon="el-icon-refresh" @click="onRefresh"> 刷新 </el-button>' +
        '</div>' +

        /* 筛选和数据卡片共用区域 */
        '<div class="filter-and-cards-section">' +
          '<div class="main-data-cards" v-if="boardData.length > 0">' +
            '<div class="data-card" v-for="(item, index) in boardData" :key="stageType + index">' +
              '<div class="card-content">' +
                '<h4 class="card-title">{{ item.dataName }}</h4>' +
                '<div class="card-metrics-row">' +
                  '<div class="metric-col">' +
                    '<div class="metric-label">我的数据</div>' +
                    '<div class="metric-value metric-my-data" :class="getDataColorClass(item)">{{ item.rate !== null && item.rate !== undefined ? item.rate + \'%\' : \'--\' }}</div>' +
                  '</div>' +
                  '<div class="metric-col">' +
                    '<div class="metric-label">我的目标</div>' +
                    '<div class="metric-value metric-my-goal">{{ item.targetRate !== null && item.targetRate !== undefined ? item.targetRate + \'%\' : \'--\' }}</div>' +
                  '</div>' +
                  '<div class="metric-col">' +
                    '<div class="metric-label">年级平均</div>' +
                    '<div class="metric-value metric-grade-avg">{{ item.avgRate !== null && item.avgRate !== undefined ? item.avgRate + \'%\' : \'--\' }}</div>' +
                  '</div>' +
                '</div>' +
                '<div class="card-actions">' +
                  '<template v-for="(keyItem, keyIndex) in item.keyItemList">' +
                    '<span v-if="keyItem.count !== undefined && keyItem.count !== null && keyItem.count > 0" :key="keyIndex" class="action-text" ' +
                      ':class="[getActionTextClass(keyItem, item.dataType), { \'action-text-disabled\': !keyItem.taskFilterValue || keyItem.taskFilterValue === \'\' }]" ' +
                      ':data-filter-value="keyItem.taskFilterValue" ' +
                      '@click.stop="(!keyItem.taskFilterValue || keyItem.taskFilterValue === \'\') ? null : onKeyItemClick(keyItem, item.dataType)">' +
                      '<span class="action-text-content">{{ keyItem.taskFilterName }} {{ keyItem.count }}</span>' +
                    '</span>' +
                  '</template>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* 筛选区域 */
          '<div class="filter-header">' +
            '<div class="student-search-wrapper">' +
              '<span class="search-label">学生ID/手机号/姓名：</span>' +
              '<el-input v-model="studentSearchKeyword" placeholder="输入学生ID/手机号或姓名，按回车查询" size="small" style="width: 280px;" ' +
                '@keyup.enter.native="onSearch" @clear="onSearch" clearable></el-input>' +
            '</div>' +

            '<el-popover placement="bottom-start" width="600" trigger="click" v-model="showFilterPopover" popper-class="x-wb-filter-popover">' +
              '<div class="filter-popover-content">' +
                '<div class="filter-form-wrapper">' +
                  '<el-form :model="userFilterForm" label-width="120px" size="small">' +
                    '<el-form-item label="进班时间">' +
                      '<el-date-picker v-model="userFilterForm.enterTimeRange" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" ' +
                        'value-format="yyyy-MM-dd HH:mm:ss" :default-time="[\'00:00:00\', \'23:59:59\']" style="width: 100%;"></el-date-picker>' +
                    '</el-form-item>' +
                    '<el-form-item label="学员类型">' +
                      '<el-select v-model="userFilterForm.relationTypes" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="纯新生" :value="1"></el-option>' +
                        '<el-option label="断档新生" :value="2"></el-option>' +
                        '<el-option label="次新生" :value="3"></el-option>' +
                        '<el-option label="老生-非我服务" :value="4"></el-option>' +
                        '<el-option label="我的老生" :value="5"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="退费风险">' +
                      '<el-select v-model="userFilterForm.refundRiskLevels" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="高" value="高"></el-option>' +
                        '<el-option label="中" value="中"></el-option>' +
                        '<el-option label="低" value="低"></el-option>' +
                        '<el-option label="未识别" value="未识别"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="续费跟进状态">' +
                      '<el-select v-model="userFilterForm.trackMarkStatus" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="待跟进" :value="0"></el-option>' +
                        '<el-option label="已跟进" :value="1"></el-option>' +
                        '<el-option label="不续费" :value="2"></el-option>' +
                        '<el-option label="已续费" :value="3"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="能力测评状态">' +
                      '<el-select v-model="userFilterForm.isFinishAssessment" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option v-for="opt in finishAssessmentOptions" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="首通状态">' +
                      '<el-select v-model="userFilterForm.firstConnStatus" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="未完成" :value="0"></el-option>' +
                        '<el-option label="按时完成" :value="1"></el-option>' +
                        '<el-option label="超时完成" :value="2"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="首轮状态">' +
                      '<el-select v-model="userFilterForm.firstRoundStatus" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="未完成" :value="0"></el-option>' +
                        '<el-option label="按时完成" :value="1"></el-option>' +
                        '<el-option label="超时完成" :value="2"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="续费意向度">' +
                      '<el-select v-model="userFilterForm.renewIntentions" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="A" value="A"></el-option>' +
                        '<el-option label="B" value="B"></el-option>' +
                        '<el-option label="C" value="C"></el-option>' +
                        '<el-option label="D" value="D"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="是否填写地址">' +
                      '<el-select v-model="userFilterForm.fillAddress" multiple placeholder="请选择" clearable collapse-tags style="width: 100%;">' +
                        '<el-option label="需一销提醒" :value="0"></el-option>' +
                        '<el-option label="已填写" :value="1"></el-option>' +
                        '<el-option label="二销提醒" :value="2"></el-option>' +
                        '<el-option label="无需填写" :value="3"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item label="是否添加企微">' +
                      '<el-select v-model="userFilterForm.addWeCom" placeholder="请选择" clearable style="width: 100%;">' +
                        '<el-option label="是" :value="1"></el-option>' +
                        '<el-option label="否" :value="0"></el-option>' +
                      '</el-select>' +
                    '</el-form-item>' +
                    '<el-form-item v-for="r in ranges" :key="r[1]" :label="r[0]">' +
                      '<div style="display: flex; align-items: center; width: 100%;">' +
                        '<el-input-number v-model="userFilterForm[r[1] + \'Min\']" placeholder="最小值" :min="0" style="width: 100px;"></el-input-number>' +
                        '<span style="margin: 0 8px;">至</span>' +
                        '<el-input-number v-model="userFilterForm[r[1] + \'Max\']" placeholder="最大值" :min="0" style="width: 100px;"></el-input-number>' +
                      '</div>' +
                    '</el-form-item>' +
                  '</el-form>' +
                '</div>' +
                '<div class="filter-actions">' +
                  '<span class="filter-tip">使用条件搜索时，无法按课节查看数据</span>' +
                  '<div>' +
                    '<el-button size="small" @click="onResetFilters">重置条件</el-button>' +
                    '<el-button type="primary" size="small" @click="onConfirmFilters">确认</el-button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<el-button slot="reference" :type="appliedCount > 0 ? \'primary\' : \'default\'" size="small" class="filter-condition-btn">' +
                ' 全部筛选条件 ' +
                '<el-badge v-if="appliedCount > 0" :value="appliedCount" class="filter-badge"></el-badge>' +
              '</el-button>' +
            '</el-popover>' +

            '<el-tooltip content="查看具体课节数据时，无法按用户条件搜索" placement="top">' +
              '<el-select v-model="selectedSchedule" placeholder="查看具体课节" size="small" style="width: 150px; margin-left: 10px;">' +
                '<el-option label="全部课节" value="all"></el-option>' +
                '<el-option v-for="schedule in scheduleList" :key="schedule.id" :label="schedule.name" :value="schedule.id"></el-option>' +
              '</el-select>' +
            '</el-tooltip>' +
          '</div>' +

          /* 课节数据卡片（选中具体课节时显示） */
          '<div class="schedule-cards" v-if="selectedSchedule && selectedSchedule !== \'all\'">' +
            '<div class="schedule-group-card" v-for="card in scheduleCards" :key="card.name">' +
              '<div class="schedule-group-header schedule-group-header--single schedule-group-header--no-border">' +
                '<div class="schedule-metric">' +
                  '<div class="schedule-metric-name">{{ card.name }}</div>' +
                  '<div class="schedule-metric-value" :class="scheduleRateClass(card.rate)">{{ card.text || formatPercent(card.rate) }}</div>' +
                '</div>' +
              '</div>' +
              '<div class="schedule-group-actions">' +
                '<span v-for="a in card.actions" :key="a[0]" class="schedule-action" :class="{ \'schedule-action-disabled\': a[1] === 0 }" @click="a[1] === 0 ? null : fake()">{{ a[0] }}{{ a[1] }}人</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* 列表区域 */
        '<div class="list-section">' +
          '<div class="table-container">' +
            '<div class="list-header-inline">' +
              '<div class="list-info">' +
                '<span>符合筛选条件的约有{{ filteredRows.length }}条</span><span>，已选中{{ selection.length }}条</span>' +
              '</div>' +
              '<div class="list-actions">' +
                '<div v-if="stageType === \'receiveNew\'" style="display: inline-block;">' +
                  '<el-button type="primary" style="margin-left: 10px;" @click="fake">能力测评群发</el-button>' +
                  '<el-button type="primary" @click="fake">测评报告群发</el-button>' +
                '</div>' +
                '<div style="display: inline-block;padding: 0 10px;">' +
                  '<el-button type="primary" @click="fake">企微群发</el-button>' +
                '</div>' +
                '<el-button @click="onClearFilters">清空筛选条件</el-button>' +
                '<el-button @click="fake">导出</el-button>' +
              '</div>' +
            '</div>' +

            '<div class="table-content">' +
              '<div class="student-list-container">' +
                TABLE_NEW + TABLE_IN + TABLE_RENEW +
                '<div class="pagination" v-if="filteredRows.length > 0">' +
                  '<el-pagination background :page-size="pageSize" :page-sizes="[10, 20, 50, 100, 200]" :current-page="currentPage" ' +
                    'layout="sizes,total, prev, pager, next" :total="filteredRows.length" @size-change="onSizeChange" @current-change="onPageChange"></el-pagination>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>' +
    '</div></div>' +
  '</div>';

  /* ---------------------------------------------------------------
   * 组件
   * --------------------------------------------------------------- */
  Vue.component('scene-workbench', C({
    data: function () {
      return {
        /* 顶部页签条：常驻 7 个 */
        currentTabName: 'Workbench',
        fixedTabList: [
          { name: 'Workbench', title: '工作台' }, { name: 'AfterClassPractice', title: '课后练习' },
          { name: 'FormalClassSupervision', title: '正价课监课' }, { name: 'SpecialClassSupervision', title: '专项课监课' },
          { name: 'ClassData', title: '班级数据' }, { name: 'TemporaryTransfer', title: '临调学员' }, { name: 'Referral', title: '转介绍' }
        ],
        /* 教辅 / 课程 / 班级 浮层 */
        filterPopoverVisible: false,
        dropdownVisible: false,
        formInline: initialForm(),
        aiTab: 'list',
        aiRecs: [],
        sumStore: {},
        /* 期段 */
        serviceStageList: [
          { tabId: 'receiveNew', tabName: '接新期' }, { tabId: 'inClass', tabName: '行课期' }, { tabId: 'renew', tabName: '续费期' }
        ],
        stageType: 'inClass',
        selectedFilterType: null,
        selectedFilterValue: null,
        /* 筛选 */
        studentSearchKeyword: '',
        appliedKeyword: '',
        showFilterPopover: false,
        userFilterForm: freshFilterForm(),
        appliedForm: freshFilterForm(),
        ranges: RANGES,
        finishAssessmentOptions: [
          { label: '未参与', value: 0 }, { label: '部分完成', value: 1 }, { label: '报告生成中', value: 2 },
          { label: '未发送', value: 3 }, { label: '已发送', value: 4 }, { label: '已查看', value: 5 }
        ],
        selectedSchedule: 'all',
        scheduleList: SCHEDULES,
        scheduleCards: SCHEDULE_CARDS,
        /* 列表 */
        selection: [],
        pageSize: 50,
        currentPage: 1
      };
    },
    computed: {
      focusN: function () { return ((this.ctx.S || {}).focus || {}).n || 0; },
      /* 侧栏展开 205 / 收起 65（真实：MutationObserver 读 .sc_menu 的 menuCollapse；这里读外壳的折叠状态） */
      menuLeft: function () {
        var p = this.$parent;
        return p && p.isCollapse ? 65 : 205;
      },
      /* 教辅：D.TEACHERS 的两位，label 沿用真实写法「姓名-账号」 */
      aiTabList: function () { return [{ name: 'list', title: '学员列表' }].concat(this.aiRecs); },
      adList: function () {
        var T = this.ctx.D.TEACHERS || {};
        return Object.keys(T).map(function (k) { return { key: k, teacherName: T[k].name, teacherAd: T[k].ad }; });
      },
      viewerKey: function () {
        var ad = this.formInline.searchAD;
        var hit = this.adList.filter(function (a) { return a.teacherAd === ad; })[0];
        return hit ? hit.key : '';
      },
      /* 课程：所选教辅名下的课程（素养课 + AI作文课） */
      courseList: function () {
        var C = this.ctx.D.COURSES || {}, key = this.viewerKey;
        return Object.keys(C).filter(function (k) { return C[k].teacher === key; })
          .map(function (k) { return { courseId: k, courseTitle: C[k].title, isAi: C[k].type === 'ai' }; });
      },
      isAi: function () {
        var c = (this.ctx.D.COURSES || {})[this.formInline.courseId];
        return !!c && c.type === 'ai';
      },
      classList: function () {
        if (this.isAi) return this.aiClassOptions();
        return this.formInline.courseId === 'formal4'
          ? [{ classIdStr: 'k4', className: '四年级(1)班' }]
          : [{ classIdStr: 'k2', className: CLASS_NAME }, { classIdStr: 'k1', className: '三年级(1)班' }];
      },
      selectedAdName: function () {
        var ad = this.adList.filter(function (a) { return a.teacherAd === this.formInline.searchAD; }, this)[0];
        return ad ? ad.teacherName : '选择教辅';
      },
      hasFilter: function () { return !!(this.formInline.courseId || this.formInline.classIds.length > 0); },
      boardData: function () { return BOARD[this.stageType] || []; },
      /* 三位学员（来自 ctx.D.STUDENTS）→ 表格行 */
      allRows: function () {
        var list = (this.ctx.D && this.ctx.D.STUDENTS) || [];
        return list.map(function (s) {
          var o = { userId: s.id, userName: s.name, className: CLASS_NAME };
          var ex = EXTRA[s.id] || {};
          for (var k in ex) { if (Object.prototype.hasOwnProperty.call(ex, k)) o[k] = ex[k]; }
          return o;
        });
      },
      /* 学生搜索（ID/手机号/姓名） + 数据卡片过滤 + 全部筛选条件 */
      filteredRows: function () {
        var kw = (this.appliedKeyword || '').trim();
        var f = this.appliedForm, sel = this.selectedFilterValue;
        return this.allRows.filter(function (r) {
          if (kw && String(r.userId).indexOf(kw) === -1 && String(r.userPhone || '').indexOf(kw) === -1 &&
              String(r.userName || '').indexOf(kw) === -1 && String(r.nickname || '').indexOf(kw) === -1) return false;
          if (sel && FILTERS[sel] && !FILTERS[sel](r)) return false;
          if (f.relationTypes.length && f.relationTypes.indexOf(r.relationType) === -1) return false;
          if (f.refundRiskLevels.length && f.refundRiskLevels.indexOf(r.refundRiskLevel) === -1) return false;
          if (f.trackMarkStatus.length && f.trackMarkStatus.indexOf(r.trackMarkStatus) === -1) return false;
          if (f.isFinishAssessment.length && f.isFinishAssessment.indexOf(r.assessmentReportStatus) === -1) return false;
          if (f.firstConnStatus.length && f.firstConnStatus.indexOf(r.firstConnStatus) === -1) return false;
          if (f.firstRoundStatus.length && f.firstRoundStatus.indexOf(r.firstRoundStatus) === -1) return false;
          if (f.renewIntentions.length && f.renewIntentions.indexOf(r.renewIntention) === -1) return false;
          if (f.fillAddress.length && f.fillAddress.indexOf(Number(r.addressFillStatus)) === -1) return false;
          if (f.addWeCom !== '' && f.addWeCom !== undefined && f.addWeCom !== null && r.addWeComStatus !== f.addWeCom) return false;
          for (var i = 0; i < RANGES.length; i++) {
            var key = RANGES[i][1], mn = f[key + 'Min'], mx = f[key + 'Max'], v = r[key] || 0;
            if (mn !== undefined && mn !== null && mn !== '' && v < mn) return false;
            if (mx !== undefined && mx !== null && mx !== '' && v > mx) return false;
          }
          return true;
        });
      },
      tableList: function () {
        var s = (this.currentPage - 1) * this.pageSize;
        return this.filteredRows.slice(s, s + this.pageSize);
      },
      /* 已生效的"全部筛选条件"个数（徽标数字） */
      appliedCount: function () {
        var f = this.appliedForm, n = 0;
        ['enterTimeRange', 'relationTypes', 'refundRiskLevels', 'trackMarkStatus', 'isFinishAssessment', 'firstConnStatus', 'firstRoundStatus', 'renewIntentions', 'fillAddress']
          .forEach(function (k) { if (f[k] && f[k].length) n++; });
        if (f.addWeCom !== '' && f.addWeCom !== undefined && f.addWeCom !== null) n++;
        RANGES.forEach(function (r) {
          var mn = f[r[1] + 'Min'], mx = f[r[1] + 'Max'];
          if ((mn !== undefined && mn !== null && mn !== '') || (mx !== undefined && mx !== null && mx !== '')) n++;
        });
        return n;
      }
    },
    watch: {
      /* 小铃铛「作文求助」：切到求助学生所在的 AI 作文课，课节定位到求助作文，打开学生的作文草稿 */
      focusN: function () {
        var f = (this.ctx.S || {}).focus, me = this;
        if (!f) return;
        var adList = this.adList, ad = (adList.filter(function (a) { return a.key === f.t; })[0] || {}).teacherAd;
        var form = this.formInline, need = (ad && form.searchAD !== ad) || form.courseId !== f.course;
        if (ad) form.searchAD = ad;
        this.$nextTick(function () {
          form.courseId = f.course;
          me.aiTab = 'list';
          setTimeout(function () { var p = me.$refs.aiPanel; if (p) p.applyFocus(f); }, need ? 120 : 0);
        });
      },
      filteredRows: function () { this.currentPage = 1; },
      /* 换教辅：课程回到该教辅的素养课；换课程：班级跟着换；两者都回到「学员列表」（AI 面板由 :key 重建、筛选重置） */
      'formInline.searchAD': function () {
        var f = this.formInline, formal = this.courseList.filter(function (c) { return !c.isAi; })[0];
        f.courseId = formal ? formal.courseId : '';
        this.aiTab = 'list'; this.aiRecs = []; this.sumStore = {};
      },
      'formInline.courseId': function (v) {
        this.aiTab = 'list'; this.aiRecs = []; this.sumStore = {};
        var cl = v === 'formal4' ? ['k4'] : ['k2'];
        var c = (this.ctx.D.COURSES || {})[v];
        if (c && c.type === 'ai') cl = this.aiClassOptions().map(function (o) { return o.classIdStr; });
        this.formInline.classIds = cl;
      },
      /* 选了具体课节：与数据卡片筛选、全部筛选条件互斥（真实：选课节时无法按用户条件搜索） */
      selectedSchedule: function (v) {
        if (v && v !== 'all') {
          this.selectedFilterType = null; this.selectedFilterValue = null;
          this.userFilterForm = freshFilterForm(); this.appliedForm = freshFilterForm();
        }
      }
    },
    methods: {
      /* AI 作文课的班级选项 = 该课程下、该教辅名下（班级 → 教辅映射）学员所在的班级；默认全选 */
      aiClassOptions: function () {
        var D = this.ctx.D || {}, CT = D.CLASS_TEACHER || {}, key = this.viewerKey, course = this.formInline.courseId, out = [];
        (this.ctx.STU || []).forEach(function (s) {
          if (s.course !== course || CT[s.cls] !== key) return;
          if (!out.some(function (o) { return o.classIdStr === s.cls; })) out.push({ classIdStr: s.cls, className: s.cls });
        });
        return out;
      },
      /* 浮层里改班级：回到「学员列表」；课节重置由 ai-panel 监听 classIds 完成；已开的档案 / 总结页签保留（沿用现有 handleClassChange） */
      onClassChange: function () { this.aiTab = 'list'; },
      /* ---- 学员档案灵活页签（同一学员复用；可关闭页签最多 5 个，沿用现有提示） ---- */
      openRec: function (row) {
        var name = 'StudentRecord_' + row.sid;
        if (!this.aiRecs.some(function (r) { return r.name === name; })) {
          if (this.aiRecs.length >= 5) { this.$message({ message: '请先关闭不用的页签', type: 'warning' }); return; }
          this.aiRecs.push({ name: name, kind: 'record', title: row.name, sid: row.sid, sname: row.name, cls: row.cls, phone: row.phone });
        }
        this.aiTab = name;
      },
      /* ---- 学情总结 / 企微群发 灵活页签（计入 5 个可关闭页签上限） ---- */
      pushRec: function (rec) {
        if (this.aiRecs.length >= 5) { this.$message({ message: '请先关闭不用的页签', type: 'warning' }); return false; }
        this.aiRecs.push(rec); return true;
      },
      openSummary: function (row) {
        var name = 'Summary_' + row.sid, key = row.sid + '|' + row.course;
        if (!this.aiRecs.some(function (r) { return r.name === name; })) {
          if (!this.sumStore[key]) this.$set(this.sumStore, key, window.XSum.newEntry(row, this.ctx));
          if (!this.pushRec({ name: name, kind: 'summary', title: '学情总结·' + row.name, row: row, key: key, sid: row.sid, sname: row.name })) return;
        }
        this.aiTab = name;
      },
      openWechat: function (p) {
        var name = 'Wechat_' + p.row.sid;
        var ex = this.aiRecs.filter(function (r) { return r.name === name; })[0];
        if (ex) { ex.content = p.content; this.aiTab = name; return; }
        if (!this.pushRec({ name: name, kind: 'wechat', title: '企微群发', sid: p.row.sid, sname: p.row.name, course: p.row.course, row: p.row,
          student: { sid: p.row.sid, name: p.row.name, cls: p.row.cls }, content: p.content })) return;
        this.aiTab = name;
      },
      /* 列表头部「企微群发」「催完课」「催提交」：同一时间只开一个群发页签 */
      openWechatBatch: function (p) {
        var name = 'Wechat_batch', ex = this.aiRecs.filter(function (r) { return r.name === name; })[0];
        var rec = { name: name, kind: 'wechat', title: '企微群发', students: p.students, student: p.students[0], taskKind: 'free', content: '',
          mode: p.mode, filterText: p.filterText, templates: p.templates, defType: p.defType,
          chase: { lesson: p.lesson, sids: p.students.map(function (s) { return s.sid; }) } };
        if (ex) { this.aiRecs.splice(this.aiRecs.indexOf(ex), 1, rec); this.aiTab = name; return; }
        if (!this.pushRec(rec)) return;
        this.aiTab = name;
      },
      onWechatSubmit: function (rec, payload) {
        if (rec.chase) {
          var panel = this.$refs.aiPanel;
          this.closeRec(rec.name);
          this.aiTab = 'list';
          if (panel) panel.markSent(rec.chase, payload);
          return;
        }
        var key = rec.row.sid + '|' + rec.row.course, sname = 'Summary_' + rec.row.sid;
        this.closeRec(rec.name);
        this.aiTab = sname;
        if (this.sumStore[key]) window.XSum.runSend(this.sumStore[key], payload, (this.ctx.D || {}).NOW);
      },
      closeRec: function (name) {
        this.aiRecs = this.aiRecs.filter(function (r) { return r.name !== name; });
        if (this.aiTab === name) this.aiTab = 'list';
      },
      /* ---- 示意类按钮 ---- */
      fake: function () { this.$act('fake', { m: FAKE }); },
      fakeCmd: function () { this.$act('fake', { m: FAKE }); },
      /* ---- 作文批改：现有入口，无改动 ---- */
      openEssay: function () { this.$act('fake', { m: '素养课的作文批改入口本次不涉及；AI 作文课请在浮层里选「AI作文课」' }); },
      /* 顶部页签：只有"工作台"是本次范围，其它页签点了给提示、保持选中"工作台" */
      onHeaderTabLeave: function (name) {
        if (name !== 'Workbench') { this.$act('fake', { m: FAKE }); return false; }
        return true;
      },
      onStageClick: function () { this.selectedFilterType = null; this.selectedFilterValue = null; this.selection = []; },
      onRefresh: function () { this.$act('fake', { m: FAKE }); },
      onSelection: function (rows) { this.selection = rows; },
      onSizeChange: function (n) { this.pageSize = n; this.currentPage = 1; },
      onPageChange: function (n) { this.currentPage = n; },
      /* ---- 数据卡片 ---- */
      getDataColorClass: function (item) {
        if (item.rate === null || item.rate === undefined || item.targetRate === null || item.targetRate === undefined) return '';
        if (item.dataType === 'newStudentRefundRate') return item.rate < item.targetRate ? 'text-green' : 'text-red';
        return item.rate >= item.targetRate ? 'text-green' : 'text-red';
      },
      getActionTextClass: function (keyItem, dataType) {
        var isSelected = this.selectedFilterType === dataType + '_' + keyItem.taskFilterValue;
        var positive = ['完成', '达成', '已', '按时', '已看', '已提交', '已出勤', '有效'];
        var negative = ['未', '超时', '未完成', '未达成', '未看', '未提交', '未出勤', '无效', '退费', '高风险'];
        var name = keyItem.taskFilterName || '', isPositive;
        if (positive.some(function (k) { return name.indexOf(k) !== -1; })) isPositive = true;
        else if (negative.some(function (k) { return name.indexOf(k) !== -1; })) isPositive = false;
        else isPositive = name.indexOf('未') === -1;
        return { 'achieved-text': isPositive, 'unachieved-text': !isPositive, 'action-selected': isSelected };
      },
      onKeyItemClick: function (keyItem, dataType) {
        var t = dataType + '_' + keyItem.taskFilterValue;
        if (this.selectedFilterType === t) { this.selectedFilterType = null; this.selectedFilterValue = null; return; }
        /* 与"全部筛选条件"、课节下拉互斥 */
        this.userFilterForm = freshFilterForm(); this.appliedForm = freshFilterForm();
        this.selectedSchedule = 'all';
        this.selectedFilterType = t; this.selectedFilterValue = keyItem.taskFilterValue;
      },
      /* ---- 筛选 ---- */
      onSearch: function () { this.appliedKeyword = this.studentSearchKeyword; },
      onConfirmFilters: function () {
        this.appliedForm = JSON.parse(JSON.stringify(this.userFilterForm));
        this.selectedFilterType = null; this.selectedFilterValue = null;
        this.showFilterPopover = false;
      },
      onResetFilters: function () {
        this.userFilterForm = freshFilterForm(); this.appliedForm = freshFilterForm();
        this.studentSearchKeyword = ''; this.appliedKeyword = '';
        this.selectedFilterType = null; this.selectedFilterValue = null;
      },
      onClearFilters: function () { this.onResetFilters(); this.selectedSchedule = 'all'; },
      /* ---- 课节卡片 ---- */
      formatPercent: function (v) {
        if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '--';
        return Number(v) + '%';
      },
      scheduleRateClass: function (v) {
        var n = Number(v);
        if (v === null || v === undefined || isNaN(n)) return '';
        if (n >= 80) return 'rate-blue';
        if (n >= 60) return 'rate-green';
        return 'rate-orange';
      },
      /* ---- 表格文案映射（StudentList.vue 的同名方法） ---- */
      getUserRelationType: function (t) { return ({ 1: '纯新生', 2: '断档新生', 3: '次新生', 4: '老生-非我服务', 5: '我的老生' })[t] || '-'; },
      getAbilityTestStatusText: function (s) {
        if (s === null || s === undefined) return '-';
        return ({ 0: '未参与', 1: '部分完成', 2: '报告生成中', 3: '未发送', 4: '已发送', 5: '已查看' })[Number(s)] || '-';
      },
      canViewAssessmentReport: function (s) { return s !== null && s !== undefined && [3, 4, 5].indexOf(Number(s)) !== -1; },
      getFirstConnStatusText: function (s) { return ({ 0: '未完成', 1: '按时完成', 2: '超时完成' })[s] || '-'; },
      getFirstRoundStatusText: function (s) { return ({ 0: '未完成', 1: '按时完成', 2: '超时完成' })[s] || '-'; },
      getAddressFillStatusText: function (s) { return ({ '0': '需一销提醒', '1': '已填写', '2': '二销提醒', '3': '无需填写' })[s] || s || '-'; },
      formatRate: function (r) { if (r === null || r === undefined) return '-'; return r + '%'; },
      formatPhone: function (row) {
        if (row.desensitizePhone) return row.desensitizePhone;
        if (row.userPhone) { var p = String(row.userPhone); return p.length === 11 ? p.substring(0, 3) + '****' + p.substring(7) : p; }
        return '';
      }
    }
  }, TEMPLATE));
})();
