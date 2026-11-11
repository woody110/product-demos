/* =====================================================================
 * main-ai.js —— AI 作文课工作台（产品方案 v2：4.2–4.5）：ai-panel
 * 浮层选到 AI 作文课后，一站式工作台把"期段页签 + 工作台"整体换成本组件。
 * MVP 只有「学员列表」一个页签（页签条由工作台渲染）；学员只在课节的学员列表里看作文、批改。
 *
 * DOM / class 复用 main-workbench.js 里的真实写法：
 *   筛选区 = .filter-and-cards-section > .filter-header > .student-search-wrapper（小号控件）
 *   统计行 = .list-header-inline；表格 = el-table（stripe / highlight-current-row / max-height 700）
 *   学员列 = .student-info；"状态 + 下方灰字 + 文字按钮" = 真实"能力测评状态"列；操作列 = .operation-buttons
 *   抽屉 = el-drawer + 真实订单信息抽屉的 student-list-order-drawer / order-detail-card 系列 class
 * 新增元素 class 一律 x- 前缀，样式见 css/main-ai.css "新增（产品方案 v2）"之后。
 * 数据全部来自 ctx.STU / ctx.E / ctx.D；动作：openEssay{id}、fake{m}。
 * ===================================================================== */
(function () {
  function C(opts, tpl) {
    var c = Vue.compile(tpl, { whitespace: 'condense' });
    opts.render = c.render;
    opts.staticRenderFns = c.staticRenderFns;
    return opts;
  }
  var FAKE = '示意：该功能本次不涉及';
  var PENDING = '#ff8000', GRADED = '#07c160';          /* 沿用班课作文批改里已有的色值 */
  var RANK = { '已完课': 0, '已学习': 1, '未学习': 2 };

  /* 批改状态单元格（学员列表、作文批改两张表共用写法） */
  function statusCell(expr) {
    return '<span v-if="' + expr + ' === \'pending\'" :style="{ color: \'' + PENDING + '\' }">待批改</span>' +
      '<span v-else-if="' + expr + ' === \'graded\'" :style="{ color: \'' + GRADED + '\' }">已批改</span>' +
      '<span v-else>-</span>';
  }

  /* 作文流转列（首次文字作文 / 订正作文）：照抄真实"能力测评状态"列的 DOM；
     已提交 / 已批改 = 「查看」，未提交 = 无按钮；批改入口在操作列 */
  function flowCol(label, which) {
    var e = 'scope.row.' + which;
    return '<el-table-column label="' + label + '" width="150" align="center">' +
      '<template slot-scope="scope">' +
        '<div style="line-height: 1.6;">' +
          '<div>{{ flowText(' + e + ') }}</div>' +
          '<template v-if="' + e + '">' +
            '<div style="font-size: 12px; color: #909399;">{{ ' + e + '.submit }}</div>' +
            '<div class="x-ai-flow-btns">' +
              '<el-button type="text" size="small" style="padding: 0;" @click="viewEssay(' + e + ')">查看</el-button>' +
            '</div>' +
          '</template>' +
        '</div>' +
      '</template>' +
    '</el-table-column>';
  }

  var STUDENT_COL =
    '<el-table-column label="学员" width="200" fixed="left">' +
      '<template slot-scope="scope">' +
        '<div class="student-info">' +
          '<div class="student-name">' +
            '<el-button type="text" @click="openStu(scope.row)" style="padding: 0; margin-right: 4px; color: #303133;"> {{ scope.row.name }} </el-button>' +
            '<el-tag v-if="scope.row.refunded" size="mini" type="danger" class="x-ai-refund-tag">已退费</el-tag>' +
          '</div>' +
          '<div class="student-id">' +
            '<el-button type="text" @click="openStu(scope.row)" style="padding: 0; margin-right: 4px;"> {{ scope.row.sid }} </el-button>' +
            '<i class="el-icon-document-copy copy-icon" style="cursor: pointer; color: #409EFF;" @click.stop="copy"></i>' +
          '</div>' +
          '<div class="student-phone">' +
            '<el-tooltip placement="top" :open-delay="1000" :content="scope.row.phone">' +
              '<span style="cursor: pointer; color: #ff5f2e; margin-right: 4px;" @click="fake"> {{ mask(scope.row.phone) }} </span>' +
            '</el-tooltip>' +
            '<i class="el-icon-document-copy copy-icon" style="cursor: pointer; color: #409EFF;" @click.stop="copy"></i>' +
          '</div>' +
        '</div>' +
      '</template>' +
    '</el-table-column>';

  var LIST_TABLE =
    '<el-table :stripe="true" :data="listPage" max-height="700px" :highlight-current-row="true" key="x-ai-table-list" @selection-change="onSel">' +
      '<el-table-column type="selection" width="55" fixed="left"></el-table-column>' +
      STUDENT_COL +
      '<el-table-column prop="cls" label="班级" width="130"></el-table-column>' +
      '<el-table-column label="课程完成" width="120"><template slot-scope="scope">' +
        '<span class="x-ai-done">{{ scope.row.done }}</span><span class="x-ai-done-total"> / {{ lessons.length }} 节</span>' +
      '</template></el-table-column>' +
      '<el-table-column label="本课节学习次数" width="130"><template slot-scope="scope">{{ scope.row.st.times }}</template></el-table-column>' +
      '<el-table-column label="最近学习时间" width="140"><template slot-scope="scope">{{ scope.row.st.last || \'-\' }}</template></el-table-column>' +
      '<el-table-column label="学习状态" width="100"><template slot-scope="scope">{{ scope.row.st.state }}</template></el-table-column>' +
      '<el-table-column label="讲解视频学习进度" width="150"><template slot-scope="scope">{{ scope.row.st.video }}%</template></el-table-column>' +
      '<el-table-column label="互动题完成情况" width="130"><template slot-scope="scope">{{ scope.row.st.qa }}</template></el-table-column>' +
      '<el-table-column label="单次学习时长" width="120"><template slot-scope="scope">{{ scope.row.st.once }}分钟</template></el-table-column>' +
      '<el-table-column label="累计学习时长" width="120"><template slot-scope="scope">{{ scope.row.st.total }}分钟</template></el-table-column>' +
      flowCol('首次文字作文', 'first') +
      flowCol('订正作文', 'second') +
      '<el-table-column label="首次提交时间" width="140"><template slot-scope="scope">{{ scope.row.first ? scope.row.first.submit : \'-\' }}</template></el-table-column>' +
      '<el-table-column label="订正提交时间" width="140"><template slot-scope="scope">{{ scope.row.second ? scope.row.second.submit : \'-\' }}</template></el-table-column>' +
      '<el-table-column label="批改状态" width="110" fixed="right">' +
        '<template slot-scope="scope"><div>' + statusCell('scope.row.bs') + '</div></template>' +
      '</el-table-column>' +
      '<el-table-column label="操作" width="150" fixed="right" align="center">' +
        '<template slot-scope="scope"><div class="operation-buttons">' +
          '<el-button v-if="scope.row.pendingE" type="text" size="mini" class="x-ai-go" @click="goGrade(scope.row.pendingE)"> 批改 </el-button>' +
          '<el-button v-else type="text" size="mini" disabled> 批改 </el-button>' +
          '<el-button v-if="!scope.row.noData" type="text" size="mini" @click="openSummary(scope.row)"> 学情总结 </el-button>' +
          '<el-tooltip v-else content="暂无学习数据" placement="top"><span><el-button type="text" size="mini" disabled> 学情总结 </el-button></span></el-tooltip>' +
        '</div></template>' +
      '</el-table-column>' +
    '</el-table>';

  function searchBox(label, inner) {
    return '<div class="student-search-wrapper"><span class="search-label">' + label + '</span>' + inner + '</div>';
  }
  function pager(totalExpr, sizeProp, curProp) {
    return '<div class="pagination" v-if="' + totalExpr + ' > 0">' +
      '<el-pagination background :page-size="' + sizeProp + '" :page-sizes="[10, 20, 50, 100, 200]" :current-page="' + curProp + '" ' +
        'layout="sizes,total, prev, pager, next" :total="' + totalExpr + '" @size-change="onSize" @current-change="onPage"></el-pagination>' +
    '</div>';
  }

  /* 抽屉里一个"信息行" */
  function row(label, expr) {
    return '<div class="order-detail-card__row"><span class="order-detail-card__label">' + label + '</span>' +
      '<span class="order-detail-card__value">' + expr + '</span></div>';
  }

  var TEMPLATE =
  '<div class="workbench-container tab-content x-ai-panel">' +

    /* ================= 学员列表 ================= */
    '<div>' +
      '<div class="filter-and-cards-section x-ai-filter-card">' +
        '<div class="filter-header x-ai-filter">' +
          searchBox('课节：',
            '<el-select v-model="lf.lesson" size="small" style="width: 200px;" placeholder="请选择课节">' +
              '<el-option v-for="l in lessons" :key="l.id" :label="l.open ? l.name : l.name + \'（未开课）\'" :value="l.id" :disabled="!l.open"></el-option>' +
            '</el-select>') +
          searchBox('批改状态：',
            '<el-select v-model="lf.status" size="small" style="width: 130px;">' +
              '<el-option label="全部" value="all"></el-option>' +
              '<el-option label="待批改" value="pending"></el-option>' +
              '<el-option label="已批改" value="graded"></el-option>' +
            '</el-select>') +
          searchBox('学生姓名：',
            '<el-input v-model="lf.nameInput" placeholder="输入学生姓名，按回车查询" size="small" style="width: 240px;" ' +
              '@keyup.enter.native="applyListName" @clear="applyListName" clearable></el-input>') +
        '</div>' +
      '</div>' +
      '<div class="x-ai-cards">' +
        '<div class="main-data-cards">' +
          '<div class="data-card x-ai-card">' +
            '<div class="card-content">' +
              '<div class="card-metrics-row">' +
                '<div class="metric-col"><div class="metric-value metric-my-data">{{ cards.done }} 人</div><div class="metric-label">完课人数</div></div>' +
                '<div class="metric-col"><div class="metric-value metric-my-goal">{{ cards.rate }}</div><div class="metric-label">完课率</div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="data-card x-ai-card">' +
            '<div class="card-content">' +
              '<div class="card-metrics-row">' +
                '<div class="metric-col"><div class="metric-value metric-my-data">{{ cards.upTotal }} 篇</div><div class="metric-label">订正作文上传总数</div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="data-card x-ai-card">' +
            '<div class="card-content">' +
              '<div class="card-metrics-row">' +
                '<div class="metric-col"><div class="metric-value metric-my-data text-red">{{ cards.pending }} 篇</div><div class="metric-label">待批改总数</div></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="list-section">' +
        '<div class="table-container">' +
          '<div class="list-header-inline">' +
            '<div class="list-info"><span>符合筛选条件的约有{{ listRows.length }}条</span><span>，已选中{{ sel.length }}条</span></div>' +
            '<div class="list-actions">' +
              '<div style="display: inline-block;padding: 0 10px;"><el-button type="primary" @click="groupSend">企微群发</el-button></div>' +
              '<el-button @click="clearList">清空筛选条件</el-button>' +
              '<el-button @click="doExport">导出</el-button>' +
            '</div>' +
          '</div>' +
          '<div class="table-content"><div class="student-list-container">' +
            LIST_TABLE +
            pager('listRows.length', 'lf.size', 'lf.page') +
          '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* ================= 抽屉：批改结果（全局组件 essay-result-drawer） ================= */
    '<essay-result-drawer :essay-id="repId" :visible.sync="repShow" @grade="goGrade"></essay-result-drawer>' +

  '</div>';

  var DRAWER_TPL =
    '<el-drawer :title="repTitle" :visible="visible" @update:visible="$emit(\'update:visible\', $event)" direction="rtl" size="480px" append-to-body custom-class="student-list-order-drawer x-ai-report-drawer">' +
      '<div class="order-detail-drawer-body" v-if="repE">' +
        '<el-alert v-if="repE.status === \'pending\'" title="待批改，暂无批改结果" type="warning" show-icon :closable="false" description="学生已提交，老师还没有批改完成，学生端还没有报告。下面是学生提交的原文。" class="x-ai-alert"></el-alert>' +
        '<div class="order-detail-card"><div class="order-detail-card__rows">' +
          row('学生', '{{ repStu ? repStu.name : \'-\' }}') +
          row('作文标题', '{{ repE.title }}') +
          row('课节', '{{ lessonName(repE.course, repE.lesson) }}') +
          row('首次 / 订正', '{{ repE.kind === \'first\' ? \'首次文字作文\' : \'订正作文\' }}') +
          row('提交时间', '{{ repE.submit }}') +
          '<template v-if="repE.status === \'graded\'">' +
            '<div v-if="repE.kind !== \'first\'">' + row('批改老师', '{{ teacherName(repE.gradedBy) }}') + '</div>' +
            row('批改时间', '{{ repE.gradedAt }}') +
          '</template>' +
        '</div></div>' +

        /* 已批改：手机外框里嵌学生端报告页（班课以 from=cm 方式嵌入） */
        '<template v-if="repE.status === \'graded\'">' +
          '<div class="x-ai-phone-wrap">' +
            '<div class="x-ai-phone"><iframe class="x-ai-phone-frame" :src="reportSrc" frameborder="0"></iframe></div>' +
            '<div class="x-ai-paper-cap">学生端预览（学生端报告页，班课以 from=cm 方式嵌入）</div>' +
          '</div>' +
        '</template>' +

        /* 待批改：学生提交的原文 / 原图 + 去批改 */
        '<template v-else>' +
          '<div class="order-detail-card"><div class="x-ai-sec-title">学生提交的作文</div>' +
            '<div v-if="repE.form === \'text\'" class="x-ai-paper x-ai-paper--text"><p v-for="(p, i) in paras" :key="i">{{ p }}</p></div>' +
            '<div v-else class="x-ai-paper-wrap">' +
              '<div class="x-ai-paper x-ai-paper--img">' +
                '<i v-for="n in 7" :key="n" class="x-ai-scribble" :style="{ top: (18 + (n - 1) * 28) + \'px\', width: (n % 3 === 0 ? 55 : n % 2 ? 86 : 72) + \'%\' }"></i>' +
              '</div>' +
              '<div class="x-ai-paper-cap">学生拍照提交</div>' +
            '</div>' +
          '</div>' +
          '<div class="x-ai-drawer-foot"><el-button type="primary" @click="$emit(\'grade\', repE)">去批改</el-button></div>' +
        '</template>' +
      '</div>' +
    '</el-drawer>';

  /* 批改结果抽屉：已批改 = 嵌学生端预览；待批改 = 原文 + 去批改。学员列表与学员档案「作文批改」共用 */
  Vue.component('essay-result-drawer', C({
    props: { essayId: String, visible: Boolean },
    computed: {
      D: function () { return this.ctx.D || {}; },
      paras: function () { return this.D.PARAS || []; },
      repE: function () { var id = this.essayId; return id ? (this.ctx.E || []).filter(function (e) { return e.id === id; })[0] || null : null; },
      repStu: function () {
        var e = this.repE;
        if (!e) return null;
        var all = (this.ctx.STU || []).filter(function (s) { return s.sid === e.sid; });
        return all.filter(function (s) { return s.course === e.course; })[0] || all[0] || null;
      },
      repGrade: function () {
        var e = this.repE, C = (this.D.COURSES || {})[e && e.course];
        return C ? String(C.title).slice(0, 3) : '-';
      },
      repTitle: function () { return this.repE ? '作文批改结果（' + (this.repE.kind === 'first' ? '首次' : '订正') + '）' : '作文批改结果'; },
      reportSrc: function () {
        var e = this.repE;
        if (!e || e.status !== 'graded') return '';
        var t = e.txt || {};
        var data = {
          kind: e.kind, form: e.form, name: this.repStu ? this.repStu.name : '', grade: this.repGrade,
          unit: this.lessonName(e.course, e.lesson), title: e.title,
          paras: this.paras, '总评': t['总评'], '详细点评': t['详细点评'], '全文润色': t['全文润色'], '诊断建议': t['诊断建议'],
          '批注说明': '老师在你的手写稿纸上圈出了写得好的地方，并写了小批注。'
        };
        return 'student-report.html#' + encodeURIComponent(JSON.stringify(data));
      }
    },
    methods: {
      lessonName: function (ck, id) {
        var l = ((this.D.LESSONS || {})[ck] || []).filter(function (x) { return x.id === id; })[0];
        return l ? l.name : '-';
      },
      teacherName: function (k) { return ((this.D.TEACHERS || {})[k] || {}).name || '-'; }
    }
  }, DRAWER_TPL));

  Vue.component('ai-panel', C({
    props: {
      courseKey: String,      /* 课程 key：'ai3' | 'ai4' */
      viewer: String,         /* 浮层所选教辅 key：'wang' | 'li' */
      classIds: Array         /* 浮层所选班级（班级名） */
    },
    data: function () {
      var ctx = window.__ctx || {}, D = ctx.D || {}, ls = (D.LESSONS || {})[this.courseKey] || [];
      /* 默认课节 = 最近一个已开课的课节；不提供"全部课节" */
      var def = ls.length ? ls[0].id : '';
      ls.forEach(function (l) { if (l.open) def = l.id; });
      return {
        lf: { lesson: def, status: 'all', nameInput: '', name: '', page: 1, size: 50 },
        repShow: false, repId: null, sel: []
      };
    },
    computed: {
      D: function () { return this.ctx.D || {}; },
      lessons: function () { return (this.D.LESSONS || {})[this.courseKey] || []; },
      paras: function () { return this.D.PARAS || []; },
      /* 学员 = 浮层所选班级下、当前课程里的学员 */
      courseStu: function () {
        var ids = this.classIds || [];
        return (this.ctx.STU || []).filter(function (s) { return s.course === this.courseKey && ids.indexOf(s.cls) !== -1; }, this);
      },
      /* ---- 汇总卡片：跟随浮层"班级"和页面"课节"；不受批改状态、姓名影响。均按所选课节统计 ---- */
      cards: function () {
        var f = this.lf, ctx = this.ctx, self = this, L = f.lesson;
        var stus = this.courseStu;
        var done = stus.filter(function (s) { return s.study[L] && s.study[L].state === '已完课'; }).length;
        var sids = stus.map(function (s) { return s.sid; });
        var ups = (ctx.E || []).filter(function (e) { return e.course === self.courseKey && e.lesson === L && e.kind === 'second' && sids.indexOf(e.sid) !== -1; });
        return {
          lessonName: this.lessonName(this.courseKey, L),
          done: done,
          rate: stus.length ? Math.round(done / stus.length * 100) + '%' : '--',
          upTotal: ups.length,
          pending: ups.filter(function (e) { return e.status === 'pending'; }).length
        };
      },
      /* ---- 学员列表 ---- */
      listAll: function () {
        var allLs = (this.D.LESSONS || {})[this.courseKey] || [], ctx = this.ctx, L = this.lf.lesson;
        return this.courseStu.map(function (s, idx) {
          var es = (ctx.E || []).filter(function (e) { return e.sid === s.sid && e.course === s.course && e.lesson === L; });
          var first = es.filter(function (e) { return e.kind === 'first'; })[0] || null;
          var second = es.filter(function (e) { return e.kind === 'second'; })[0] || null;
          var pend = es.filter(function (e) { return e.status === 'pending'; });
          var bs = pend.length ? 'pending' : es.some(function (e) { return e.status === 'graded'; }) ? 'graded' : 'none';
          var st = s.study[L] || { times: 0, last: null, state: '未学习', video: 0, qa: '0/5', once: 0, total: 0, steps: '0/6', draft: false };
          return {
            idx: idx, sid: s.sid, name: s.name, phone: s.phone, cls: s.cls, refunded: s.refunded, course: s.course,
            st: st, first: first, second: second, bs: bs, pendingE: pend[0] || null, noData: !allLs.some(function (l) { return s.study[l.id] && s.study[l.id].times > 0; }), done: allLs.filter(function (l) { return s.study[l.id] && s.study[l.id].state === '已完课'; }).length,
            earliest: pend.length ? pend.map(function (e) { return e.submit; }).sort()[0] : ''
          };
        });
      },
      listRows: function () {
        var f = this.lf;
        var rows = this.listAll.filter(function (r) {
          if (f.status !== 'all' && r.bs !== f.status) return false;
          if (f.name && r.name.indexOf(f.name.trim()) === -1) return false;
          return true;
        });
        /* 待批改在前（提交早的在前）；其余按学习状态 已完课 > 已学习 > 未学习 */
        return rows.sort(function (a, b) {
          var pa = a.bs === 'pending' ? 0 : 1, pb = b.bs === 'pending' ? 0 : 1;
          if (pa !== pb) return pa - pb;
          if (pa === 0 && a.earliest !== b.earliest) return a.earliest < b.earliest ? -1 : 1;
          var ra = RANK[a.st.state], rb = RANK[b.st.state];
          if (ra !== rb) return ra - rb;
          return a.idx - b.idx;
        });
      },
      listPage: function () { var s = (this.lf.page - 1) * this.lf.size; return this.listRows.slice(s, s + this.lf.size); }
    },
    watch: {
      'lf.lesson': function () { this.lf.page = 1; },
      /* 浮层里改班级：课节回到默认、回第一页 */
      classIds: function () { this.resetLesson(); this.lf.page = 1; },
      'lf.status': function () { this.lf.page = 1; },
      'lf.name': function () { this.lf.page = 1; }
    },
    methods: {
      fake: function () { this.$act('fake', { m: FAKE }); },
      copy: function () { this.$message({ message: '复制成功', type: 'success' }); },
      mask: function (p) { p = String(p || ''); return p.length === 11 ? p.substring(0, 3) + '****' + p.substring(7) : p; },
      lessonName: function (ck, id) {
        var l = ((this.D.LESSONS || {})[ck] || []).filter(function (x) { return x.id === id; })[0];
        return l ? l.name : '-';
      },
      teacherName: function (k) { return ((this.D.TEACHERS || {})[k] || {}).name || '-'; },
      flowText: function (e) { return !e ? '未提交' : e.status === 'graded' ? '已批改' : '已提交'; },
      onSel: function (rows) { this.sel = rows; },
      openSummary: function (row) { this.$emit('open-summary', { sid: row.sid, name: row.name, cls: row.cls, phone: row.phone, course: row.course, refunded: !!row.refunded }); },
      openStu: function (row) { this.$emit('open-student', { sid: row.sid, name: row.name, cls: row.cls, phone: row.phone }); },
      groupSend: function () {
        if (!this.sel.length) { this.$message({ message: '请先勾选要群发的学员', type: 'warning' }); return; }
        var n = this.sel.filter(function (r) { return r.refunded; }).length;
        this.$message({ message: '已选 ' + this.sel.length + ' 人，进入企微群发' + (n ? '（其中 ' + n + ' 位已退费学员已自动排除）' : ''), type: 'success' });
      },
      doExport: function () { this.$message({ message: '已导出当前筛选结果 ' + this.listRows.length + ' 条（Excel，字段同列表各列）', type: 'success' }); },
      onSize: function (n) { this.lf.size = n; this.lf.page = 1; },
      onPage: function (n) { this.lf.page = n; },
      applyListName: function () { this.lf.name = this.lf.nameInput; },
      clearList: function () {
        var f = this.lf;
        f.status = 'all'; f.nameInput = ''; f.name = '';
        this.resetLesson();
      },
      resetLesson: function () {
        var ls = this.lessons, def = ls.length ? ls[0].id : '';
        ls.forEach(function (l) { if (l.open) def = l.id; });
        this.lf.lesson = def;
      },
      viewEssay: function (e) { this.repId = e.id; this.repShow = true; },
      /* 列表 / 抽屉里进入批改：所选教辅不是登录人时只读 */
      goGrade: function (e) { this.repShow = false; this.$act('openEssay', { id: e.id, ro: this.viewer !== (this.ctx.S || {}).me }); }
    }
  }, TEMPLATE));
})();
