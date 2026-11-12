/* =====================================================================
 * main-follow.js —— 跟进抽屉 follow-drawer（真实：src/components/addFollowDrawer/index.vue）
 * 结构与 class 沿用真实抽屉：标题（呼叫 + 姓名 - 手机号 + 外呼 + 沟通场景）、左侧页签「用户智能档案 / 学情数据」、右侧「沟通内容」、底部「提交」。
 * 新增（本期）：AI 作文课学员的「学情数据」页签 = 小节维度的两部分——整体学情数据 + 各小节学情数据。
 * 数据来自 ctx.STU / ctx.E / ctx.D；样式见 css/main-follow.css。
 * ===================================================================== */
(function () {
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }
  function num(s) { return parseInt(s, 10) || 0; }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '--'; }

  var TPL =
  '<el-drawer size="80%" custom-class="follow-drawer-container" :visible="visible" @update:visible="$emit(\'update:visible\', $event)" :destroy-on-close="true" :show-close="false" append-to-body :before-close="close">' +
    '<div slot="title" class="drawer-title">' +
      '<div class="title-left">' +
        '<i class="el-icon-close close-icon" @click="close"></i>' +
        '<span>呼叫</span><span>{{ row ? row.name : \'\' }}</span><span> - </span><span>{{ row ? row.phone : \'\' }}</span>' +
        '<div class="call-actions">' +
          '<div style="color: #67C23A;cursor: pointer;" @click="fake">坐席外呼 <i class="el-icon-service" style="font-size: 22px;"></i></div>' +
          '<div style="color: #409EFF;margin-left: 10px;cursor: pointer;" @click="fake">手机外呼 <i class="el-icon-mobile-phone" style="font-size: 22px;"></i></div>' +
        '</div>' +
      '</div>' +
      '<div class="follow-type">沟通场景：' +
        '<el-select v-model="followType" placeholder="请选择">' +
          '<el-option v-for="t in types" :key="t" :label="t" :value="t"></el-option>' +
        '</el-select>' +
      '</div>' +
    '</div>' +
    '<div class="drawer-content" v-if="row">' +
      '<div class="drawer-body">' +
        '<div class="drawer-left-panel"><div class="left-tabs-wrap">' +
          '<el-tabs v-model="activeTab" class="info-tabs">' +
            '<el-tab-pane label="用户智能档案" name="baseInfo"><div class="tab-content">' +
              '<div class="tip" style="padding: 10px 0; color: #999; font-size: 12px;">（部分内容由AI识别生成，请根据用户实际情况有选择性的使用）</div>' +
              '<div class="content-section"><div class="content-section-title before-line">个人信息</div>' +
                '<div class="content-section-body">' +
                  '<div class="section-item before-dot"><p>学员姓名：{{ row.name }}</p></div>' +
                  '<div class="section-item before-dot"><p>学员类型：{{ info.type }}</p></div>' +
                  '<div class="section-item before-dot"><p>所在城市：{{ info.city }}</p></div>' +
                  '<div class="section-item before-dot"><p>新老生：{{ info.old }}</p></div>' +
                  '<div class="section-item before-dot"><p>正价课学习期数：{{ info.formal }}</p><p class="tip">（累计该账号下所有孩子的正价课，包含当前期次）</p></div>' +
                  '<div class="section-item before-dot"><p>学校学制：{{ info.school }}</p></div>' +
                  '<div class="section-item before-dot"><p>家庭情况：{{ info.family }}</p></div>' +
                  '<div class="section-item before-dot"><p>家长核心诉求：<el-tag v-for="d in info.demands" :key="d" size="mini" effect="plain" class="demand-tag">{{ d }}</el-tag></p></div>' +
                  '<div class="section-item before-dot"><p>新生来源：{{ info.channel }}</p></div>' +
                  '<div class="section-item before-dot"><p>体验课期次及销售老师：{{ info.trial }}</p></div>' +
                  '<div class="section-item before-dot"><p>报名时间：{{ info.reg }}</p></div>' +
                  '<div class="section-item before-dot"><p>上一个订单付费时间：-</p></div>' +
                  '<div class="section-item before-dot"><p>当前订单付费时间：{{ info.pay }}</p></div>' +
                  '<div class="section-item before-dot"><p>最近一次退费/挽单时间：无记录</p></div>' +
                  '<div class="section-item before-dot"><p>AI总结：</p><div class="ai-summary-markdown">{{ info.ai }}</div></div>' +
                '</div></div>' +
            '</div></el-tab-pane>' +
            '<el-tab-pane label="学情数据" name="lessonAction"><div class="tab-content">' +
              /* 第一部分：整体学情数据 */
              '<div class="content-section"><div class="content-section-title before-line">整体学情数据（每节课结束后更新）</div>' +
                '<div class="student-lesson-content-body">' +
                  '<div class="section-item before-dot"><div>{{ total.done }}/{{ total.lessons }}</div><div>完课</div><div>{{ total.doneRate }}</div></div>' +
                  '<div class="section-item before-dot"><div>{{ total.correct }}/{{ total.answered }}</div><div>互动答题正确率</div><div>{{ total.accRate }}</div></div>' +
                  '<div class="section-item before-dot"><div>{{ total.submitted }}/{{ total.lessons }}</div><div>作文提交篇数</div><div>{{ total.submitRate }}</div></div>' +
                  '<div class="section-item before-dot"><div>{{ total.answered }}/{{ total.questions }}</div><div>互动参与率</div><div>{{ total.joinRate }}</div></div>' +
                '</div></div>' +
              /* 第二部分：各小节学情数据 */
              '<div class="content-section"><div class="content-section-title before-line">各小节学情数据</div>' +
                '<div class="table-container">' +
                  '<el-table :data="rows" size="small" border style="width: 100%;">' +
                    '<el-table-column prop="name" label="小节" width="118" fixed></el-table-column>' +
                    '<el-table-column label="是否完课" width="64"><template slot-scope="s">{{ s.row.done ? \'是\' : \'否\' }}</template></el-table-column>' +
                    '<el-table-column label="视频学习时长（首次）" width="96"><template slot-scope="s">{{ s.row.learned ? s.row.vmin + \'分钟\' : \'-\' }}</template></el-table-column>' +
                    '<el-table-column label="写作步骤进度" width="72"><template slot-scope="s">{{ s.row.steps }}</template></el-table-column>' +
                    '<el-table-column label="互动题完成情况" width="76"><template slot-scope="s">{{ s.row.qa }}</template></el-table-column>' +
                    '<el-table-column label="互动题答题正确率" width="84"><template slot-scope="s">{{ s.row.acc == null ? \'-\' : s.row.acc + \'%\' }}</template></el-table-column>' +
                    '<el-table-column label="学习时长（首次）" width="84"><template slot-scope="s">{{ s.row.learned ? s.row.dur + \'分钟\' : \'-\' }}</template></el-table-column>' +
                    '<el-table-column label="作文提交" width="64"><template slot-scope="s"><el-button v-if="s.row.submitted" type="text" size="mini" style="padding:0" @click="openEssay(s.row)">是</el-button><span v-else>否</span></template></el-table-column>' +
                    '<el-table-column label="提交时间" width="96"><template slot-scope="s">{{ s.row.submitted ? s.row.submit : \'--\' }}</template></el-table-column>' +
                  '</el-table>' +
                '</div></div>' +
            '</div></el-tab-pane>' +
            '<el-tab-pane label="家长预期" name="parentExpectation"><div class="tab-content parent-expectation-tab">' +
              '<div class="x-fd-qa" v-for="(q, i) in survey" :key="i"><div class="x-fd-q">{{ i + 1 }}、{{ q.q }}</div><div class="x-fd-a"><span v-for="a in q.opts" :key="a" class="x-fd-opt" :class="{ on: q.pick.indexOf(a) > -1 }">{{ a }}</span></div></div>' +
            '</div></el-tab-pane>' +
            '<el-tab-pane v-if="showAbility" label="测评报告" name="abilityTest"><div class="tab-content ability-test-tab">' +
              '<div class="ability-test-summary">' +
                '<div class="summary-item"><span class="summary-label">学习时长</span><span class="summary-value">{{ ab.dur }}分钟</span></div>' +
                '<div class="summary-item"><span class="summary-label">答题率</span><span class="summary-value">{{ ab.ans }} / {{ ab.total }}</span></div>' +
                '<div class="summary-item"><span class="summary-label">正答率</span><span class="summary-value">{{ ab.ok }} / {{ ab.ans }}</span></div>' +
              '</div>' +
              '<div class="ability-test-empty">能力测评报告沿用班课现有，原型不演示</div>' +
            '</div></el-tab-pane>' +
          '</el-tabs>' +
        '</div></div>' +
        '<div class="drawer-center-panel">' +
          '<div class="center-panel-title">沟通策略</div>' +
          '<div class="center-panel-content">' +
            '<div class="tip" style="padding: 10px 0; color: #999; font-size: 12px;">（部分内容由AI识别生成，请根据用户实际情况有选择性的使用）</div>' +
            '<div class="content-section"><div class="content-section-title before-line">学员近期情况：</div><div class="content-section-body"><div class="section-item"><p>{{ strat.stu }}</p></div></div></div>' +
            '<div class="content-section"><div class="content-section-title before-line">家长近期情况：</div><div class="content-section-body"><div class="section-item"><p>{{ strat.parent }}</p></div></div></div>' +
            '<div class="content-section"><div class="content-section-title before-line">其他补充信息：</div><div class="content-section-body"><div class="section-item"><p>{{ strat.other }}</p></div></div></div>' +
            '<div class="content-section"><div class="content-section-title before-line">最近一次有效沟通：{{ strat.last }}</div></div>' +
            '<div class="content-section"><div class="content-section-title before-line">家长负面情绪：<div class="negative-tag-wrap"><el-tag size="mini" effect="dark">暂无</el-tag></div></div></div>' +
            '<div class="content-section"><div class="content-section-title before-line">沟通策略：</div><div class="content-section-body"><div class="section-item"><div class="ai-summary-markdown">{{ strat.tips }}</div></div></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-right-panel">' +
          '<div class="drawer-body-item-title"><div class="title">沟通内容</div></div>' +
          '<div class="drawer-body-item-content">' +
            '<el-form label-position="top">' +
              '<el-form-item><el-input type="textarea" :rows="10" placeholder="请添加详细描述，不超过500字" :maxlength="500" show-word-limit v-model="remark"></el-input></el-form-item>' +
              '<el-form-item label="沟通渠道" style="margin-bottom: 10px;"><el-radio-group v-model="channel"><el-radio :label="1">坐席外呼</el-radio><el-radio :label="2">工作手机</el-radio><el-radio :label="3">微信</el-radio></el-radio-group></el-form-item>' +
              '<el-form-item label="结束类型"><el-radio-group v-model="finish"><el-radio :label="1">未接通</el-radio><el-radio :label="2">完成沟通</el-radio><el-radio :label="3">下次再联系</el-radio></el-radio-group></el-form-item>' +
            '</el-form>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="drawer-footer"><el-button type="primary" @click="submit">提交</el-button></div>' +
    '<el-dialog :visible.sync="dlg" :title="dlgTitle" width="460px" append-to-body custom-class="x-fd-dlg">' +
      '<div v-if="cur">' +
        '<div class="x-fd-dlg-bar"><el-radio-group v-model="view" size="small">' +
          '<el-radio-button label="essay">作文（最终提交版）</el-radio-button>' +
          '<el-radio-button label="report" :disabled="!cur.graded">批改报告</el-radio-button>' +
        '</el-radio-group><span v-if="!cur.graded" class="x-fd-dlg-tip">批改报告还没有生成</span></div>' +
        '<div class="x-ai-phone-wrap"><div class="x-ai-phone"><iframe class="x-ai-phone-frame" :src="frameSrc" frameborder="0"></iframe></div>' +
        '<div class="x-ai-paper-cap">学生端（C 端）页面 · {{ view === \'report\' ? \'批改报告\' : \'作文最终提交版\' }}</div></div>' +
      '</div>' +
    '</el-dialog>' +
  '</el-drawer>';

  Vue.component('follow-drawer', C({
    props: { row: Object, visible: Boolean },
    data: function () { return { dlg: false, cur: null, view: 'essay', activeTab: 'lessonAction', followType: '首通', remark: '', channel: 1, finish: 2, types: ['首通', '首轮', '首课', '挽单沟通', '续费沟通', '空白期回访', '作业回访', '出勤回访', '阶段性学情回访', '重点跟进', '能力测评沟通', '其他'] }; },
    watch: { visible: function (v) { if (v) { this.activeTab = 'lessonAction'; this.remark = ''; this.followType = '首通'; } } },
    computed: {
      D: function () { return this.ctx.D || {}; },
      showAbility: function () { return this.followType === '首通' || this.followType === '能力测评沟通'; },
      info: function () {
        return { type: '纯新生', city: '北京', old: '新生', formal: 0, school: '六三制', family: '父母陪伴，家长较关注作文', demands: ['提高作文成绩', '培养阅读习惯'],
          channel: '直播间', trial: '第12期·体验课·周老师', reg: '2026-10-20 18:30:00', pay: '2026-10-25 09:12:00',
          ai: '孩子表达积极，写作愿意动笔，家长希望通过 AI 作文课提升写作结构与细节描写。' };
      },
      survey: function () {
        return [
          { q: '孩子目前写作文最大的困难是什么？', opts: ['不知道写什么', '写不具体', '语句不通顺', '没有兴趣'], pick: ['写不具体'] },
          { q: '您希望孩子通过课程达到什么目标？', opts: ['提高作文成绩', '培养阅读习惯', '提升表达能力'], pick: ['提高作文成绩', '培养阅读习惯'] },
          { q: '孩子每周能投入的写作时间？', opts: ['30分钟以内', '30-60分钟', '1小时以上'], pick: ['30-60分钟'] }
        ];
      },
      strat: function () {
        return { stu: '近期完成了第 1~3 课学习，写作表达积极，细节描写偏弱。', parent: '家长关注作文成绩，愿意配合订正。', other: '周末晚间可沟通。',
          last: '2026-11-04 电话沟通', tips: '先肯定孩子写作的积极性，再用本节作文的具体例子说明细节描写的提升点，邀请家长陪孩子完成订正。' };
      },
      dlgTitle: function () { return this.cur ? this.cur.name + ' · 作文' : '作文'; },
      frameSrc: function () {
        var c = this.cur, e = c && c.essay;
        if (!e) return '';
        var t = e.txt || {}, D = this.D, ck = this.row.course, C = (D.COURSES || {})[ck];
        var data = { view: this.view, draft: false, name: this.row.name, grade: C ? String(C.title).slice(0, 3) : '-', unit: c.name, title: e.title,
          paras: D.PARAS || [], '总评': t['总评'], '详细点评': t['详细点评'], '全文润色': t['全文润色'], '诊断建议': t['诊断建议'] };
        return 'student-report.html#' + encodeURIComponent(JSON.stringify(data));
      },
      ab: function () { return { dur: 18, ans: 5, total: 5, ok: 4 }; },
      /* 该学员在这门 AI 作文课里、已开课小节的学情 */
      rows: function () {
        var row = this.row, ctx = this.ctx;
        if (!row) return [];
        var stu = (ctx.STU || []).filter(function (s) { return s.sid === row.sid && s.course === row.course; })[0] || { study: {} };
        return ((this.D.LESSONS || {})[row.course] || []).filter(function (l) { return l.open; }).map(function (l) {
          var st = stu.study[l.id] || { times: 0, state: '未学习', qa: '0/5', steps: '0/5', video: 0, once: 0, acc: null };
          var es = (ctx.E || []).filter(function (e) { return e.sid === row.sid && e.course === row.course && e.lesson === l.id; })[0];
          return {
            name: l.name, learned: st.times > 0, done: st.state === '已完课', vmin: Math.round(st.video * 0.12),
            steps: num(st.steps) + '/' + (l.stepTotal || 5), qa: st.qa, ans: num(st.qa), qtotal: num(String(st.qa).split('/')[1]), acc: st.acc, dur: st.once,
            submitted: !!es && es.status !== 'draft', submit: es ? es.submit : '', essay: es || null, graded: !!es && es.status === 'graded', lessonId: l.id
          };
        });
      },
      total: function () {
        var r = this.rows, t = { lessons: r.length, done: 0, answered: 0, correct: 0, questions: 0, submitted: 0 };
        r.forEach(function (x) {
          if (x.done) t.done++;
          if (x.submitted) t.submitted++;
          t.answered += x.ans; t.questions += x.qtotal;
          t.correct += Math.round(x.ans * (x.acc || 0) / 100);
        });
        t.doneRate = pct(t.done, t.lessons); t.accRate = pct(t.correct, t.answered);
        t.submitRate = pct(t.submitted, t.lessons); t.joinRate = pct(t.answered, t.questions);
        return t;
      }
    },
    methods: {
      openEssay: function (r) { this.cur = r; this.view = 'essay'; this.dlg = true; },
      fake: function () { this.$act('fake', { m: '外呼是班课现有功能，原型里不演示' }); },
      close: function () { this.$emit('update:visible', false); },
      submit: function () { this.$message({ message: '跟进记录已提交（示意）', type: 'success' }); this.close(); }
    }
  }, TPL));
})();
