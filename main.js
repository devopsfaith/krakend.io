(() => {
  // ns-hugo:/github/workspace/assets/js/vendor/jquery-ui.min.js
  !function(t) {
    "function" == typeof define && define.amd ? define(["jquery"], t) : t(jQuery);
  }(function(C) {
    C.ui = C.ui || {};
    C.ui.version = "1.12.1";
    var n, i = 0, r = Array.prototype.slice;
    C.cleanData = (n = C.cleanData, function(t2) {
      for (var e, i2, o2 = 0; null != (i2 = t2[o2]); o2++) try {
        (e = C._data(i2, "events")) && e.remove && C(i2).triggerHandler("remove");
      } catch (t3) {
      }
      n(t2);
    }), C.widget = function(t2, i2, e) {
      var o2, n2, s2, l2 = {}, r2 = t2.split(".")[0], a2 = r2 + "-" + (t2 = t2.split(".")[1]);
      return e || (e = i2, i2 = C.Widget), C.isArray(e) && (e = C.extend.apply(null, [{}].concat(e))), C.expr[":"][a2.toLowerCase()] = function(t3) {
        return !!C.data(t3, a2);
      }, C[r2] = C[r2] || {}, o2 = C[r2][t2], n2 = C[r2][t2] = function(t3, e2) {
        if (!this._createWidget) return new n2(t3, e2);
        arguments.length && this._createWidget(t3, e2);
      }, C.extend(n2, o2, { version: e.version, _proto: C.extend({}, e), _childConstructors: [] }), (s2 = new i2()).options = C.widget.extend({}, s2.options), C.each(e, function(e2, o3) {
        function n3() {
          return i2.prototype[e2].apply(this, arguments);
        }
        function s3(t3) {
          return i2.prototype[e2].apply(this, t3);
        }
        C.isFunction(o3) ? l2[e2] = function() {
          var t3, e3 = this._super, i3 = this._superApply;
          return this._super = n3, this._superApply = s3, t3 = o3.apply(this, arguments), this._super = e3, this._superApply = i3, t3;
        } : l2[e2] = o3;
      }), n2.prototype = C.widget.extend(s2, { widgetEventPrefix: o2 && s2.widgetEventPrefix || t2 }, l2, { constructor: n2, namespace: r2, widgetName: t2, widgetFullName: a2 }), o2 ? (C.each(o2._childConstructors, function(t3, e2) {
        var i3 = e2.prototype;
        C.widget(i3.namespace + "." + i3.widgetName, n2, e2._proto);
      }), delete o2._childConstructors) : i2._childConstructors.push(n2), C.widget.bridge(t2, n2), n2;
    }, C.widget.extend = function(t2) {
      for (var e, i2, o2 = r.call(arguments, 1), n2 = 0, s2 = o2.length; n2 < s2; n2++) for (e in o2[n2]) i2 = o2[n2][e], o2[n2].hasOwnProperty(e) && void 0 !== i2 && (C.isPlainObject(i2) ? t2[e] = C.isPlainObject(t2[e]) ? C.widget.extend({}, t2[e], i2) : C.widget.extend({}, i2) : t2[e] = i2);
      return t2;
    }, C.widget.bridge = function(s2, e) {
      var l2 = e.prototype.widgetFullName || s2;
      C.fn[s2] = function(i2) {
        var t2 = "string" == typeof i2, o2 = r.call(arguments, 1), n2 = this;
        return t2 ? this.length || "instance" !== i2 ? this.each(function() {
          var t3, e2 = C.data(this, l2);
          return "instance" === i2 ? (n2 = e2, false) : e2 ? C.isFunction(e2[i2]) && "_" !== i2.charAt(0) ? (t3 = e2[i2].apply(e2, o2)) !== e2 && void 0 !== t3 ? (n2 = t3 && t3.jquery ? n2.pushStack(t3.get()) : t3, false) : void 0 : C.error("no such method '" + i2 + "' for " + s2 + " widget instance") : C.error("cannot call methods on " + s2 + " prior to initialization; attempted to call method '" + i2 + "'");
        }) : n2 = void 0 : (o2.length && (i2 = C.widget.extend.apply(null, [i2].concat(o2))), this.each(function() {
          var t3 = C.data(this, l2);
          t3 ? (t3.option(i2 || {}), t3._init && t3._init()) : C.data(this, l2, new e(i2, this));
        })), n2;
      };
    }, C.Widget = function() {
    }, C.Widget._childConstructors = [], C.Widget.prototype = { widgetName: "widget", widgetEventPrefix: "", defaultElement: "<div>", options: { classes: {}, disabled: false, create: null }, _createWidget: function(t2, e) {
      e = C(e || this.defaultElement || this)[0], this.element = C(e), this.uuid = i++, this.eventNamespace = "." + this.widgetName + this.uuid, this.bindings = C(), this.hoverable = C(), this.focusable = C(), this.classesElementLookup = {}, e !== this && (C.data(e, this.widgetFullName, this), this._on(true, this.element, { remove: function(t3) {
        t3.target === e && this.destroy();
      } }), this.document = C(e.style ? e.ownerDocument : e.document || e), this.window = C(this.document[0].defaultView || this.document[0].parentWindow)), this.options = C.widget.extend({}, this.options, this._getCreateOptions(), t2), this._create(), this.options.disabled && this._setOptionDisabled(this.options.disabled), this._trigger("create", null, this._getCreateEventData()), this._init();
    }, _getCreateOptions: function() {
      return {};
    }, _getCreateEventData: C.noop, _create: C.noop, _init: C.noop, destroy: function() {
      var i2 = this;
      this._destroy(), C.each(this.classesElementLookup, function(t2, e) {
        i2._removeClass(e, t2);
      }), this.element.off(this.eventNamespace).removeData(this.widgetFullName), this.widget().off(this.eventNamespace).removeAttr("aria-disabled"), this.bindings.off(this.eventNamespace);
    }, _destroy: C.noop, widget: function() {
      return this.element;
    }, option: function(t2, e) {
      var i2, o2, n2, s2 = t2;
      if (0 === arguments.length) return C.widget.extend({}, this.options);
      if ("string" == typeof t2) if (s2 = {}, t2 = (i2 = t2.split(".")).shift(), i2.length) {
        for (o2 = s2[t2] = C.widget.extend({}, this.options[t2]), n2 = 0; n2 < i2.length - 1; n2++) o2[i2[n2]] = o2[i2[n2]] || {}, o2 = o2[i2[n2]];
        if (t2 = i2.pop(), 1 === arguments.length) return void 0 === o2[t2] ? null : o2[t2];
        o2[t2] = e;
      } else {
        if (1 === arguments.length) return void 0 === this.options[t2] ? null : this.options[t2];
        s2[t2] = e;
      }
      return this._setOptions(s2), this;
    }, _setOptions: function(t2) {
      for (var e in t2) this._setOption(e, t2[e]);
      return this;
    }, _setOption: function(t2, e) {
      return "classes" === t2 && this._setOptionClasses(e), this.options[t2] = e, "disabled" === t2 && this._setOptionDisabled(e), this;
    }, _setOptionClasses: function(t2) {
      var e, i2, o2;
      for (e in t2) o2 = this.classesElementLookup[e], t2[e] !== this.options.classes[e] && o2 && o2.length && (i2 = C(o2.get()), this._removeClass(o2, e), i2.addClass(this._classes({ element: i2, keys: e, classes: t2, add: true })));
    }, _setOptionDisabled: function(t2) {
      this._toggleClass(this.widget(), this.widgetFullName + "-disabled", null, !!t2), t2 && (this._removeClass(this.hoverable, null, "ui-state-hover"), this._removeClass(this.focusable, null, "ui-state-focus"));
    }, enable: function() {
      return this._setOptions({ disabled: false });
    }, disable: function() {
      return this._setOptions({ disabled: true });
    }, _classes: function(n2) {
      var s2 = [], l2 = this;
      function t2(t3, e) {
        for (var i2, o2 = 0; o2 < t3.length; o2++) i2 = l2.classesElementLookup[t3[o2]] || C(), i2 = n2.add ? C(C.unique(i2.get().concat(n2.element.get()))) : C(i2.not(n2.element).get()), l2.classesElementLookup[t3[o2]] = i2, s2.push(t3[o2]), e && n2.classes[t3[o2]] && s2.push(n2.classes[t3[o2]]);
      }
      return n2 = C.extend({ element: this.element, classes: this.options.classes || {} }, n2), this._on(n2.element, { remove: "_untrackClassesElement" }), n2.keys && t2(n2.keys.match(/\S+/g) || [], true), n2.extra && t2(n2.extra.match(/\S+/g) || []), s2.join(" ");
    }, _untrackClassesElement: function(i2) {
      var o2 = this;
      C.each(o2.classesElementLookup, function(t2, e) {
        -1 !== C.inArray(i2.target, e) && (o2.classesElementLookup[t2] = C(e.not(i2.target).get()));
      });
    }, _removeClass: function(t2, e, i2) {
      return this._toggleClass(t2, e, i2, false);
    }, _addClass: function(t2, e, i2) {
      return this._toggleClass(t2, e, i2, true);
    }, _toggleClass: function(t2, e, i2, o2) {
      o2 = "boolean" == typeof o2 ? o2 : i2;
      var n2 = "string" == typeof t2 || null === t2, t2 = { extra: n2 ? e : i2, keys: n2 ? t2 : e, element: n2 ? this.element : t2, add: o2 };
      return t2.element.toggleClass(this._classes(t2), o2), this;
    }, _on: function(n2, s2, t2) {
      var l2, r2 = this;
      "boolean" != typeof n2 && (t2 = s2, s2 = n2, n2 = false), t2 ? (s2 = l2 = C(s2), this.bindings = this.bindings.add(s2)) : (t2 = s2, s2 = this.element, l2 = this.widget()), C.each(t2, function(t3, e) {
        function i2() {
          if (n2 || true !== r2.options.disabled && !C(this).hasClass("ui-state-disabled")) return ("string" == typeof e ? r2[e] : e).apply(r2, arguments);
        }
        "string" != typeof e && (i2.guid = e.guid = e.guid || i2.guid || C.guid++);
        var o2 = t3.match(/^([\w:-]*)\s*(.*)$/), t3 = o2[1] + r2.eventNamespace, o2 = o2[2];
        o2 ? l2.on(t3, o2, i2) : s2.on(t3, i2);
      });
    }, _off: function(t2, e) {
      e = (e || "").split(" ").join(this.eventNamespace + " ") + this.eventNamespace, t2.off(e).off(e), this.bindings = C(this.bindings.not(t2).get()), this.focusable = C(this.focusable.not(t2).get()), this.hoverable = C(this.hoverable.not(t2).get());
    }, _delay: function(t2, e) {
      var i2 = this;
      return setTimeout(function() {
        return ("string" == typeof t2 ? i2[t2] : t2).apply(i2, arguments);
      }, e || 0);
    }, _hoverable: function(t2) {
      this.hoverable = this.hoverable.add(t2), this._on(t2, { mouseenter: function(t3) {
        this._addClass(C(t3.currentTarget), null, "ui-state-hover");
      }, mouseleave: function(t3) {
        this._removeClass(C(t3.currentTarget), null, "ui-state-hover");
      } });
    }, _focusable: function(t2) {
      this.focusable = this.focusable.add(t2), this._on(t2, { focusin: function(t3) {
        this._addClass(C(t3.currentTarget), null, "ui-state-focus");
      }, focusout: function(t3) {
        this._removeClass(C(t3.currentTarget), null, "ui-state-focus");
      } });
    }, _trigger: function(t2, e, i2) {
      var o2, n2, s2 = this.options[t2];
      if (i2 = i2 || {}, (e = C.Event(e)).type = (t2 === this.widgetEventPrefix ? t2 : this.widgetEventPrefix + t2).toLowerCase(), e.target = this.element[0], n2 = e.originalEvent) for (o2 in n2) o2 in e || (e[o2] = n2[o2]);
      return this.element.trigger(e, i2), !(C.isFunction(s2) && false === s2.apply(this.element[0], [e].concat(i2)) || e.isDefaultPrevented());
    } }, C.each({ show: "fadeIn", hide: "fadeOut" }, function(s2, l2) {
      C.Widget.prototype["_" + s2] = function(e, t2, i2) {
        var o2;
        "string" == typeof t2 && (t2 = { effect: t2 });
        var n2 = t2 ? true !== t2 && "number" != typeof t2 && t2.effect || l2 : s2;
        "number" == typeof (t2 = t2 || {}) && (t2 = { duration: t2 }), o2 = !C.isEmptyObject(t2), t2.complete = i2, t2.delay && e.delay(t2.delay), o2 && C.effects && C.effects.effect[n2] ? e[s2](t2) : n2 !== s2 && e[n2] ? e[n2](t2.duration, t2.easing, i2) : e.queue(function(t3) {
          C(this)[s2](), i2 && i2.call(e[0]), t3();
        });
      };
    });
    var o, W, T, s, l, a, h, d, E;
    C.widget;
    function x(t2, e, i2) {
      return [parseFloat(t2[0]) * (d.test(t2[0]) ? e / 100 : 1), parseFloat(t2[1]) * (d.test(t2[1]) ? i2 / 100 : 1)];
    }
    function D(t2, e) {
      return parseInt(C.css(t2, e), 10) || 0;
    }
    W = Math.max, T = Math.abs, s = /left|center|right/, l = /top|center|bottom/, a = /[\+\-]\d+(\.[\d]+)?%?/, h = /^\w+/, d = /%$/, E = C.fn.position, C.position = { scrollbarWidth: function() {
      if (void 0 !== o) return o;
      var t2, e = C("<div style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'><div style='height:100px;width:auto;'></div></div>"), i2 = e.children()[0];
      return C("body").append(e), t2 = i2.offsetWidth, e.css("overflow", "scroll"), t2 === (i2 = i2.offsetWidth) && (i2 = e[0].clientWidth), e.remove(), o = t2 - i2;
    }, getScrollInfo: function(t2) {
      var e = t2.isWindow || t2.isDocument ? "" : t2.element.css("overflow-x"), i2 = t2.isWindow || t2.isDocument ? "" : t2.element.css("overflow-y"), e = "scroll" === e || "auto" === e && t2.width < t2.element[0].scrollWidth;
      return { width: "scroll" === i2 || "auto" === i2 && t2.height < t2.element[0].scrollHeight ? C.position.scrollbarWidth() : 0, height: e ? C.position.scrollbarWidth() : 0 };
    }, getWithinInfo: function(t2) {
      var e = C(t2 || window), i2 = C.isWindow(e[0]), o2 = !!e[0] && 9 === e[0].nodeType;
      return { element: e, isWindow: i2, isDocument: o2, offset: !i2 && !o2 ? C(t2).offset() : { left: 0, top: 0 }, scrollLeft: e.scrollLeft(), scrollTop: e.scrollTop(), width: e.outerWidth(), height: e.outerHeight() };
    } }, C.fn.position = function(u) {
      if (!u || !u.of) return E.apply(this, arguments);
      u = C.extend({}, u);
      var c, p, f, g, m, t2, v = C(u.of), _ = C.position.getWithinInfo(u.within), y = C.position.getScrollInfo(_), w = (u.collision || "flip").split(" "), b = {}, e = 9 === (t2 = (e = v)[0]).nodeType ? { width: e.width(), height: e.height(), offset: { top: 0, left: 0 } } : C.isWindow(t2) ? { width: e.width(), height: e.height(), offset: { top: e.scrollTop(), left: e.scrollLeft() } } : t2.preventDefault ? { width: 0, height: 0, offset: { top: t2.pageY, left: t2.pageX } } : { width: e.outerWidth(), height: e.outerHeight(), offset: e.offset() };
      return v[0].preventDefault && (u.at = "left top"), p = e.width, f = e.height, g = e.offset, m = C.extend({}, g), C.each(["my", "at"], function() {
        var t3, e2, i2 = (u[this] || "").split(" ");
        1 === i2.length && (i2 = s.test(i2[0]) ? i2.concat(["center"]) : l.test(i2[0]) ? ["center"].concat(i2) : ["center", "center"]), i2[0] = s.test(i2[0]) ? i2[0] : "center", i2[1] = l.test(i2[1]) ? i2[1] : "center", t3 = a.exec(i2[0]), e2 = a.exec(i2[1]), b[this] = [t3 ? t3[0] : 0, e2 ? e2[0] : 0], u[this] = [h.exec(i2[0])[0], h.exec(i2[1])[0]];
      }), 1 === w.length && (w[1] = w[0]), "right" === u.at[0] ? m.left += p : "center" === u.at[0] && (m.left += p / 2), "bottom" === u.at[1] ? m.top += f : "center" === u.at[1] && (m.top += f / 2), c = x(b.at, p, f), m.left += c[0], m.top += c[1], this.each(function() {
        var i2, t3, l2 = C(this), r2 = l2.outerWidth(), a2 = l2.outerHeight(), e2 = D(this, "marginLeft"), o2 = D(this, "marginTop"), n2 = r2 + e2 + D(this, "marginRight") + y.width, s2 = a2 + o2 + D(this, "marginBottom") + y.height, h2 = C.extend({}, m), d2 = x(b.my, l2.outerWidth(), l2.outerHeight());
        "right" === u.my[0] ? h2.left -= r2 : "center" === u.my[0] && (h2.left -= r2 / 2), "bottom" === u.my[1] ? h2.top -= a2 : "center" === u.my[1] && (h2.top -= a2 / 2), h2.left += d2[0], h2.top += d2[1], i2 = { marginLeft: e2, marginTop: o2 }, C.each(["left", "top"], function(t4, e3) {
          C.ui.position[w[t4]] && C.ui.position[w[t4]][e3](h2, { targetWidth: p, targetHeight: f, elemWidth: r2, elemHeight: a2, collisionPosition: i2, collisionWidth: n2, collisionHeight: s2, offset: [c[0] + d2[0], c[1] + d2[1]], my: u.my, at: u.at, within: _, elem: l2 });
        }), u.using && (t3 = function(t4) {
          var e3 = g.left - h2.left, i3 = e3 + p - r2, o3 = g.top - h2.top, n3 = o3 + f - a2, s3 = { target: { element: v, left: g.left, top: g.top, width: p, height: f }, element: { element: l2, left: h2.left, top: h2.top, width: r2, height: a2 }, horizontal: i3 < 0 ? "left" : 0 < e3 ? "right" : "center", vertical: n3 < 0 ? "top" : 0 < o3 ? "bottom" : "middle" };
          p < r2 && T(e3 + i3) < p && (s3.horizontal = "center"), f < a2 && T(o3 + n3) < f && (s3.vertical = "middle"), W(T(e3), T(i3)) > W(T(o3), T(n3)) ? s3.important = "horizontal" : s3.important = "vertical", u.using.call(this, t4, s3);
        }), l2.offset(C.extend(h2, { using: t3 }));
      });
    }, C.ui.position = { fit: { left: function(t2, e) {
      var i2 = e.within, o2 = i2.isWindow ? i2.scrollLeft : i2.offset.left, n2 = i2.width, s2 = t2.left - e.collisionPosition.marginLeft, l2 = o2 - s2, r2 = s2 + e.collisionWidth - n2 - o2;
      e.collisionWidth > n2 ? 0 < l2 && r2 <= 0 ? (i2 = t2.left + l2 + e.collisionWidth - n2 - o2, t2.left += l2 - i2) : t2.left = !(0 < r2 && l2 <= 0) && r2 < l2 ? o2 + n2 - e.collisionWidth : o2 : 0 < l2 ? t2.left += l2 : 0 < r2 ? t2.left -= r2 : t2.left = W(t2.left - s2, t2.left);
    }, top: function(t2, e) {
      var i2 = e.within, o2 = i2.isWindow ? i2.scrollTop : i2.offset.top, n2 = e.within.height, s2 = t2.top - e.collisionPosition.marginTop, l2 = o2 - s2, r2 = s2 + e.collisionHeight - n2 - o2;
      e.collisionHeight > n2 ? 0 < l2 && r2 <= 0 ? (i2 = t2.top + l2 + e.collisionHeight - n2 - o2, t2.top += l2 - i2) : t2.top = !(0 < r2 && l2 <= 0) && r2 < l2 ? o2 + n2 - e.collisionHeight : o2 : 0 < l2 ? t2.top += l2 : 0 < r2 ? t2.top -= r2 : t2.top = W(t2.top - s2, t2.top);
    } }, flip: { left: function(t2, e) {
      var i2 = e.within, o2 = i2.offset.left + i2.scrollLeft, n2 = i2.width, s2 = i2.isWindow ? i2.scrollLeft : i2.offset.left, l2 = t2.left - e.collisionPosition.marginLeft, r2 = l2 - s2, a2 = l2 + e.collisionWidth - n2 - s2, h2 = "left" === e.my[0] ? -e.elemWidth : "right" === e.my[0] ? e.elemWidth : 0, i2 = "left" === e.at[0] ? e.targetWidth : "right" === e.at[0] ? -e.targetWidth : 0, l2 = -2 * e.offset[0];
      r2 < 0 ? ((o2 = t2.left + h2 + i2 + l2 + e.collisionWidth - n2 - o2) < 0 || o2 < T(r2)) && (t2.left += h2 + i2 + l2) : 0 < a2 && (0 < (s2 = t2.left - e.collisionPosition.marginLeft + h2 + i2 + l2 - s2) || T(s2) < a2) && (t2.left += h2 + i2 + l2);
    }, top: function(t2, e) {
      var i2 = e.within, o2 = i2.offset.top + i2.scrollTop, n2 = i2.height, s2 = i2.isWindow ? i2.scrollTop : i2.offset.top, l2 = t2.top - e.collisionPosition.marginTop, r2 = l2 - s2, a2 = l2 + e.collisionHeight - n2 - s2, h2 = "top" === e.my[1] ? -e.elemHeight : "bottom" === e.my[1] ? e.elemHeight : 0, i2 = "top" === e.at[1] ? e.targetHeight : "bottom" === e.at[1] ? -e.targetHeight : 0, l2 = -2 * e.offset[1];
      r2 < 0 ? ((o2 = t2.top + h2 + i2 + l2 + e.collisionHeight - n2 - o2) < 0 || o2 < T(r2)) && (t2.top += h2 + i2 + l2) : 0 < a2 && (0 < (s2 = t2.top - e.collisionPosition.marginTop + h2 + i2 + l2 - s2) || T(s2) < a2) && (t2.top += h2 + i2 + l2);
    } }, flipfit: { left: function() {
      C.ui.position.flip.left.apply(this, arguments), C.ui.position.fit.left.apply(this, arguments);
    }, top: function() {
      C.ui.position.flip.top.apply(this, arguments), C.ui.position.fit.top.apply(this, arguments);
    } } };
    var t;
    C.ui.position, C.ui.keyCode = { BACKSPACE: 8, COMMA: 188, DELETE: 46, DOWN: 40, END: 35, ENTER: 13, ESCAPE: 27, HOME: 36, LEFT: 37, PAGE_DOWN: 34, PAGE_UP: 33, PERIOD: 190, RIGHT: 39, SPACE: 32, TAB: 9, UP: 38 }, C.fn.extend({ uniqueId: (t = 0, function() {
      return this.each(function() {
        this.id || (this.id = "ui-id-" + ++t);
      });
    }), removeUniqueId: function() {
      return this.each(function() {
        /^ui-id-\d+$/.test(this.id) && C(this).removeAttr("id");
      });
    } });
    C.widget("ui.tooltip", { version: "1.12.1", options: { classes: { "ui-tooltip": "ui-corner-all ui-widget-shadow" }, content: function() {
      var t2 = C(this).attr("title") || "";
      return C("<a>").text(t2).html();
    }, hide: true, items: "[title]:not([disabled])", position: { my: "left top+15", at: "left bottom", collision: "flipfit flip" }, show: true, track: false, close: null, open: null }, _addDescribedBy: function(t2, e) {
      var i2 = (t2.attr("aria-describedby") || "").split(/\s+/);
      i2.push(e), t2.data("ui-tooltip-id", e).attr("aria-describedby", C.trim(i2.join(" ")));
    }, _removeDescribedBy: function(t2) {
      var e = t2.data("ui-tooltip-id"), i2 = (t2.attr("aria-describedby") || "").split(/\s+/), e = C.inArray(e, i2);
      -1 !== e && i2.splice(e, 1), t2.removeData("ui-tooltip-id"), (i2 = C.trim(i2.join(" "))) ? t2.attr("aria-describedby", i2) : t2.removeAttr("aria-describedby");
    }, _create: function() {
      this._on({ mouseover: "open", focusin: "open" }), this.tooltips = {}, this.parents = {}, this.liveRegion = C("<div>").attr({ role: "log", "aria-live": "assertive", "aria-relevant": "additions" }).appendTo(this.document[0].body), this._addClass(this.liveRegion, null, "ui-helper-hidden-accessible"), this.disabledTitles = C([]);
    }, _setOption: function(t2, e) {
      var i2 = this;
      this._super(t2, e), "content" === t2 && C.each(this.tooltips, function(t3, e2) {
        i2._updateContent(e2.element);
      });
    }, _setOptionDisabled: function(t2) {
      this[t2 ? "_disable" : "_enable"]();
    }, _disable: function() {
      var o2 = this;
      C.each(this.tooltips, function(t2, e) {
        var i2 = C.Event("blur");
        i2.target = i2.currentTarget = e.element[0], o2.close(i2, true);
      }), this.disabledTitles = this.disabledTitles.add(this.element.find(this.options.items).addBack().filter(function() {
        var t2 = C(this);
        if (t2.is("[title]")) return t2.data("ui-tooltip-title", t2.attr("title")).removeAttr("title");
      }));
    }, _enable: function() {
      this.disabledTitles.each(function() {
        var t2 = C(this);
        t2.data("ui-tooltip-title") && t2.attr("title", t2.data("ui-tooltip-title"));
      }), this.disabledTitles = C([]);
    }, open: function(t2) {
      var i2 = this, e = C(t2 ? t2.target : this.element).closest(this.options.items);
      e.length && !e.data("ui-tooltip-id") && (e.attr("title") && e.data("ui-tooltip-title", e.attr("title")), e.data("ui-tooltip-open", true), t2 && "mouseover" === t2.type && e.parents().each(function() {
        var t3, e2 = C(this);
        e2.data("ui-tooltip-open") && ((t3 = C.Event("blur")).target = t3.currentTarget = this, i2.close(t3, true)), e2.attr("title") && (e2.uniqueId(), i2.parents[this.id] = { element: this, title: e2.attr("title") }, e2.attr("title", ""));
      }), this._registerCloseHandlers(t2, e), this._updateContent(e, t2));
    }, _updateContent: function(e, i2) {
      var t2 = this.options.content, o2 = this, n2 = i2 ? i2.type : null;
      if ("string" == typeof t2 || t2.nodeType || t2.jquery) return this._open(i2, e, t2);
      (t2 = t2.call(e[0], function(t3) {
        o2._delay(function() {
          e.data("ui-tooltip-open") && (i2 && (i2.type = n2), this._open(i2, e, t3));
        });
      })) && this._open(i2, e, t2);
    }, _open: function(t2, e, i2) {
      var o2, n2, s2, l2 = C.extend({}, this.options.position);
      function r2(t3) {
        l2.of = t3, n2.is(":hidden") || n2.position(l2);
      }
      i2 && ((o2 = this._find(e)) ? o2.tooltip.find(".ui-tooltip-content").html(i2) : (e.is("[title]") && (t2 && "mouseover" === t2.type ? e.attr("title", "") : e.removeAttr("title")), o2 = this._tooltip(e), n2 = o2.tooltip, this._addDescribedBy(e, n2.attr("id")), n2.find(".ui-tooltip-content").html(i2), this.liveRegion.children().hide(), (i2 = C("<div>").html(n2.find(".ui-tooltip-content").html())).removeAttr("name").find("[name]").removeAttr("name"), i2.removeAttr("id").find("[id]").removeAttr("id"), i2.appendTo(this.liveRegion), this.options.track && t2 && /^mouse/.test(t2.type) ? (this._on(this.document, { mousemove: r2 }), r2(t2)) : n2.position(C.extend({ of: e }, this.options.position)), n2.hide(), this._show(n2, this.options.show), this.options.track && this.options.show && this.options.show.delay && (s2 = this.delayedShow = setInterval(function() {
        n2.is(":visible") && (r2(l2.of), clearInterval(s2));
      }, C.fx.interval)), this._trigger("open", t2, { tooltip: n2 })));
    }, _registerCloseHandlers: function(t2, e) {
      var i2 = { keyup: function(t3) {
        t3.keyCode === C.ui.keyCode.ESCAPE && ((t3 = C.Event(t3)).currentTarget = e[0], this.close(t3, true));
      } };
      e[0] !== this.element[0] && (i2.remove = function() {
        this._removeTooltip(this._find(e).tooltip);
      }), t2 && "mouseover" !== t2.type || (i2.mouseleave = "close"), t2 && "focusin" !== t2.type || (i2.focusout = "close"), this._on(true, e, i2);
    }, close: function(t2) {
      var e, i2 = this, o2 = C(t2 ? t2.currentTarget : this.element), n2 = this._find(o2);
      n2 ? (e = n2.tooltip, n2.closing || (clearInterval(this.delayedShow), o2.data("ui-tooltip-title") && !o2.attr("title") && o2.attr("title", o2.data("ui-tooltip-title")), this._removeDescribedBy(o2), n2.hiding = true, e.stop(true), this._hide(e, this.options.hide, function() {
        i2._removeTooltip(C(this));
      }), o2.removeData("ui-tooltip-open"), this._off(o2, "mouseleave focusout keyup"), o2[0] !== this.element[0] && this._off(o2, "remove"), this._off(this.document, "mousemove"), t2 && "mouseleave" === t2.type && C.each(this.parents, function(t3, e2) {
        C(e2.element).attr("title", e2.title), delete i2.parents[t3];
      }), n2.closing = true, this._trigger("close", t2, { tooltip: e }), n2.hiding || (n2.closing = false))) : o2.removeData("ui-tooltip-open");
    }, _tooltip: function(t2) {
      var e = C("<div>").attr("role", "tooltip"), i2 = C("<div>").appendTo(e), o2 = e.uniqueId().attr("id");
      return this._addClass(i2, "ui-tooltip-content"), this._addClass(e, "ui-tooltip", "ui-widget ui-widget-content"), e.appendTo(this._appendTo(t2)), this.tooltips[o2] = { element: t2, tooltip: e };
    }, _find: function(t2) {
      t2 = t2.data("ui-tooltip-id");
      return t2 ? this.tooltips[t2] : null;
    }, _removeTooltip: function(t2) {
      t2.remove(), delete this.tooltips[t2.attr("id")];
    }, _appendTo: function(t2) {
      t2 = t2.closest(".ui-front, dialog");
      return t2.length || (t2 = this.document[0].body), t2;
    }, _destroy: function() {
      var o2 = this;
      C.each(this.tooltips, function(t2, e) {
        var i2 = C.Event("blur"), e = e.element;
        i2.target = i2.currentTarget = e[0], o2.close(i2, true), C("#" + t2).remove(), e.data("ui-tooltip-title") && (e.attr("title") || e.attr("title", e.data("ui-tooltip-title")), e.removeData("ui-tooltip-title"));
      }), this.liveRegion.remove();
    } }), false !== C.uiBackCompat && C.widget("ui.tooltip", C.ui.tooltip, { options: { tooltipClass: null }, _tooltip: function() {
      var t2 = this._superApply(arguments);
      return this.options.tooltipClass && t2.tooltip.addClass(this.options.tooltipClass), t2;
    } });
    C.ui.tooltip;
  });

  // ns-hugo:/github/workspace/assets/js/cookies.js
  var eucookielaw_data = {
    euCookieSet: null,
    autoBlock: "0",
    expireTimer: "90",
    scrollConsent: "0",
    networkShareURL: "",
    isCookiePage: "",
    isRefererWebsite: "",
    deleteCookieUrl: "/?nocookie=1"
  };
  $(document).ready(function() {
    var euCookieSet = eucookielaw_data.euCookieSet;
    var expireTimer = eucookielaw_data.expireTimer;
    var scrollConsent = eucookielaw_data.scrollConsent;
    var networkShareURL = eucookielaw_data.networkShareURL;
    var isCookiePage = eucookielaw_data.isCookiePage;
    var isRefererWebsite = eucookielaw_data.isRefererWebsite;
    var deleteCookieUrl = eucookielaw_data.deleteCookieUrl;
    var autoBlock = eucookielaw_data.autoBlock;
    if (document.cookie.indexOf("euCookie") >= 0) {
      $(".pea_cook_wrapper").addClass("hidden");
      euCookieSet = 1;
    } else {
      $(".pea_cook_wrapper").removeClass("hidden");
    }
    if (euCookieSet > 0) {
      createCookie();
    }
    $(".ACCEPT_COOKIES").on("click", function(e) {
      e.preventDefault();
      euCookieConsent();
    });
    $(window).scroll(function() {
      if (scrollConsent > 0 && document.cookie.indexOf("euCookie") < 0 && !euCookieSet) {
        if (!isCookiePage) {
          euCookieConsent();
        }
      }
    });
    function euCookieConsent() {
      createCookie();
      if (autoBlock == 1) {
        window.location = window.location;
      }
    }
    function createCookie() {
      var today = /* @__PURE__ */ new Date(), expire = /* @__PURE__ */ new Date();
      var cookiestring = "euCookie=set;";
      if (expireTimer > 0) {
        expire.setTime(today.getTime() + expireTimer * 24 * 60 * 60 * 1e3);
        cookiestring = "euCookie=set; SameSite=Strict; " + networkShareURL + "expires=" + expire.toUTCString() + "; path=/";
      } else {
        cookiestring = "euCookie=set; SameSite=Strict; " + networkShareURL + "path=/";
      }
      document.cookie = cookiestring;
      $(".pea_cook_wrapper").addClass("hidden");
      $("#cookiesConsent").addClass("hidden");
    }
  });

  // <stdin>
  $(document).ready(function() {
    $("#navbarMenu li.dropdown").hover(function() {
      $(this).find(".dropdown-menu").stop(true, true).delay(100).fadeIn(500);
    }, function() {
      $(this).find(".dropdown-menu").stop(true, true).delay(100).fadeOut(500);
    });
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle="collapse"]').click(function(e) {
      e.preventDefault();
      var hide = $(this).data("hide");
      if (hide) {
        $(hide).slideUp();
        $(hide).siblings().removeClass("active");
      }
      var target = $(this).attr("data-target");
      if ($(target).is(":visible")) {
        $(this).filter(".close-arrow").removeClass("close-arrow").addClass("open-arrow");
        $(target).slideUp();
      } else {
        $(this).filter(".open-arrow").removeClass("open-arrow").addClass("close-arrow");
        $(target).slideDown();
      }
      $(this).toggleClass("active");
      $(this).toggleClass("active");
    });
    $('[data-toggle="modal"]').click(function() {
      $('[role="dialog"]').not(".hidden").addClass("hidden");
      var target = $(this).data("target");
      $(target).removeClass("hidden");
    });
    $('[data-dismiss="modal"].close').click(function() {
      $(this).parents('[role="dialog"]').addClass("hidden");
    });
    $("div.carousel button.carousel-prev").click(function() {
      var carousel = $(this).parents("div.carousel").find("div.carousel-content");
      var active_node = carousel.find("div.active");
      if (active_node.length === 0) active_node = carousel.find("div:first");
      var prev_node = active_node.prev();
      if (prev_node.length === 0) return;
      if (prev_node.prev().length === 0) $(this).addClass("invisible");
      $("div.carousel div button.carousel-next").removeClass("invisible");
      active_node.removeClass("active");
      prev_node.addClass("active");
      carousel.animate({ scrollLeft: active_node.width() * prev_node.index(), height: prev_node.height() + 136 }, 1e3);
    });
    $("div.carousel div button.carousel-next").click(function() {
      var carousel = $(this).parents("div.carousel").find("div.carousel-content");
      var active_node = carousel.find("div.active");
      if (active_node.length === 0) active_node = carousel.find("div:first");
      var next_node = active_node.next();
      if (next_node.length === 0) return;
      if (next_node.next().length === 0) $(this).addClass("invisible");
      $("div.carousel div button.carousel-prev").removeClass("invisible");
      active_node.removeClass("active");
      next_node.addClass("active");
      carousel.animate({ scrollLeft: active_node.width() * next_node.index(), height: next_node.height() + 136 }, 1e3);
    });
    $("div.carousel div.carousel-content").animate({ height: $("div.carousel div.carousel-content > div:first").height() + 136 });
    var automatic_carousel = $("div.carousel.auto");
    if (automatic_carousel.length) scrollCarouselToEnd(automatic_carousel);
    $("a.copy-link").click(function(e) {
      e.preventDefault();
      let href = this.href;
      let rect = this.getBoundingClientRect();
      if (!href.startsWith("http")) {
        href = new URL(href, window.location.href).href;
      }
      const textArea = document.createElement("textarea");
      textArea.value = href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      const popover = document.createElement("div");
      popover.textContent = "Copied!";
      popover.classList.add("absolute", "bg-black", "rounded", "text-white", "px-2", "py-1", "opacity-0", "transition-opacity", "text-sm");
      popover.style.top = `${rect.bottom + document.documentElement.scrollTop - rect.height * 2}px`;
      popover.style.left = `${rect.right + document.documentElement.scrollLeft}px`;
      document.body.appendChild(popover);
      setTimeout(() => {
        popover.classList.add("opacity-100");
      }, 0);
      setTimeout(() => {
        popover.classList.remove("opacity-100");
      }, 3e3);
      setTimeout(() => {
        document.body.removeChild(popover);
      }, 3500);
    });
    $(".prose h2, .prose h3").each(function() {
      if (this.id) {
        $("<a>", { href: "#" + this.id, text: "#", class: "anchor" }).prependTo(this);
      }
    });
    $(".copy-clipboard").on("click", function() {
      const target = $($(this).attr("data-id"));
      const codeToCopy = target?.text() || "";
      copyTextToClipBoard(codeToCopy, () => {
        this.classList.add("copy-success");
        setTimeout(() => {
          this.classList.remove("copy-success");
        }, 2e3);
      });
    });
  });
  function scrollCarouselToEnd(carousel) {
    carousel.animate(
      { scrollLeft: carousel.get(0).scrollWidth - carousel.width() },
      {
        duration: 3e4,
        complete: function() {
          scrollCarouselToStart(carousel);
        }
      }
    );
  }
  function scrollCarouselToStart(carousel) {
    carousel.animate(
      { scrollLeft: 0 },
      {
        duration: 3e4,
        complete: function() {
          scrollCarouselToEnd(carousel);
        }
      }
    );
  }
  function copyTextToClipBoard(text = "", callback) {
    text = text.trim();
    navigator.clipboard.writeText(text).then((data) => {
      if (callback) {
        callback();
      }
    });
  }
})();
/*! jQuery UI - v1.12.1 - 2021-05-18
* http://jqueryui.com
* Includes: widget.js, position.js, keycode.js, unique-id.js, widgets/tooltip.js
* Copyright jQuery Foundation and other contributors; Licensed MIT */
