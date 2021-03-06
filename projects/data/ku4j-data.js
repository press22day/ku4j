(function($){
if(!$) $ = {};
function cookie() { cookie.base.call(this); }
cookie.prototype = {
	name: function(name) { return this.property("name", name); },
	expires: function(expires) { return this.property("expires", expires); },
	domain: function(domain) { return this.property("domain", domain); },
	path: function(path) { return this.property("path", path); },
	isSecure: function(isSecure) { return this.property("isSecure", isSecure); },
	erase: function() {
		this.expires(new Date("1/1/2000"));
		this.save();
		return this;
	},
	save: function(obj) {
		document.cookie = $.cookie.serialize(obj,
						     { name: this._name,
						       expires: this._expires,
						       path: this._path,
						       domain: this._domain,
						       isSecure: this._isSecure } );
		return this;
	}
}
$.ext(cookie, $.Class);

$.cookie = function(params){
	var p = params || {},
	    o = ($.isString(p))
		? cookie_defaultParams.replicate().merge({name:p}).toObject()
		: cookie_defaultParams.replicate().merge(p).toObject();
	return  (new cookie())
			.name(o.name)
			.expires(o.expires)
			.path(o.path)
			.domain(o.domain)
			.isSecure(o.isSecure);
}

$.cookie.erase = function(name){
	$.cookie.load(name).erase();
}

$.cookie.load = function(name){
	var o = ($.isObject(name)) ? name : { name: name };
	    p = cookie_defaultParams.replicate().merge(o).toObject()
	return $.cookie(p);
}

$.cookie.find = function(name){
	var c = document.cookie.split("; "), i = c.length;
	while (i--) {
		var cke = c[i].split("=");
		if (cke[0] === name) return c[i];
	}
	return null;
}

$.cookie.serialize = function(obj, params) {
	var pms = params || {},
		o = cookie_defaultParams.replicate().merge(pms).toObject(),
		n = o.name,
		e = o.expires,
		p = o.path,
		d = o.domain,
		s = o.isSecure,
		I = cookie_buildInfoPair(n, escape($.json.serialize(obj))),
		E = ($.isDate(e)) ? cookie_buildInfoPair("; expires", e.toGMTString()) : "",
		P = (!p) ? "" : cookie_buildInfoPair("; path", escape(p)),
		D = (!d) ? "" : cookie_buildInfoPair("; domain", escape(d)),
		S = (!s) ? "" : "; secure";
		
	return I + E + P + D + S;
}

$.cookie.deserialize = function(cookie) {
    try {
        var ck = (/;/.test(cookie))
            ? cookie.substring(0, cookie.search(";")).split("=")
            : cookie.split("="),
            kv = { key: ck[0], value: ck[1] };
        return $.json.deserialize(unescape(kv.value));
    }
    catch(e){ throw $.exception("arg", $.str.format("Cannot deserialize {0}", cookie)); }
}

var cookie_defaultParams = $.hash({name:$.uid("COOKIE"),
				expires: $.dayPoint.today().nextYear().toDate(),
				path:"/",
				domain:null,
				isSecure:false });
	
var cookie_buildInfoPair = function(k, v) { return k + "=" + v; };

function dto(obj) {
    dto.base.call(this, obj);
}
dto.prototype = {
    name: function(name){ return this.set("name", name); },
    toJson: function() { return $.json.serialize(this.$h); },
    toQueryString: function() { return $.queryString.serialize(this.$h); },
    saveAs: function(name) {
        if(!name) throw $.exception("arg", "$.dto.saveAs requires a name");
        $.cookie(name).save(this.$h);
        this._name = name;
        return this;
    },
    save: function(){
        var name = this._name || $.uid("dto");
        this.saveAs(name);
        return name;
    },
    erase: function(){
        var name = this._name;
        if($.exists(name)) $.cookie.erase(name);
        return this;
    },
    replicate: function(){ return $.dto($.replicate(this.$h)); }
}
$.ext(dto, $.hash.Class);

$.dto = function(obj){ return new dto(obj); }
$.dto.parseJson = function(str) { return $.dto($.json.deserialize(str)); }
$.dto.parseQueryString = function(str) { return $.dto($.queryString.deserialize(str)); }
$.dto.serialize = function(name) {
    try { return new dto($.cookie.deserialize($.cookie.find(name))).name(name); }
    catch(e) { return null; }
}

$.json = {
	serialize: function(obj) {
		if ($.isNull(obj)) return null;
		if ($.isUndefined(obj)) return undefined;
		if (!$.isArray(obj) && !$.isObject(obj))
			return obj.toString();
		var r = [],
			f = ($.isArray(obj)) ? "[{0}]" : "{{0}}";
		for (var n in obj) {
			var o = obj[n];
			if ($.isFunction(o)) continue;
			 var   v = ($.isNumber(o))
					? o
					: ($.isString(o))
						? '"' + o + '"'
						: $.json.serialize(o); 
			r[r.length] = (($.isObject(obj) && !$.isArray(obj))
				? ("\"" + n + "\"" + ":")
				: "") + v;
		}
		return $.str.format(f, r);
	},
	deserialize: function(str) {
		if ($.isObject(str)) return str;
		if ($.isString(str))
			try { return eval("(" + str + ")"); }
		catch (e) { return str; }
		return undefined;
	}
}

$.queryString = {
	serialize: function(obj) {
		var r = "",
			e = encodeURIComponent;
		for (var n in obj)
			r += $.str.format("&{0}={1}", e(n), e($.json.serialize(obj[n])));
		return r.replace(/^\&/, "");
	},
	deserialize: function(str) {
		var q = str.replace(/.*\?/, ""), o = {}, kvs = q.split("&");
		if(!/\??\w+=\w+/.test(str)) return null;
		for (var n in kvs) {
			var d = decodeURIComponent, kv = (kvs[n]).split("=");
			o[d(kv[0])] = $.json.deserialize(d(kv[1]));
		}
		return o;
	}
}

})($);
