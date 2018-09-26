(function ($) {
	"use strict";
	var pluginName = "prettyNumber";

	function Plugin(element, options) {
		this.element = element;
		this._defaults = {};
		this.settings = $.extend({}, this._defaults, options);
		this._name = pluginName;
		this.init();
	}

	$.extend(Plugin.prototype, {
		init: function () {
			var element = this.element;
			this.oldValue = element.value;

			$(element).on('keydown', this.__onKeyDown.bind(this));
			$(element).on('keyup', this.__onKeyUp.bind(this));
			$(element).on('blur change', this.__onChange.bind(this));

			$(element).trigger('keyup');
		},

		formatNumber: function(number) {
			number = number.toString().replace(/ /g, "");
			return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
		},

		normalNumber: function(number, float) {
			var value = number.split(' ').join('');

			if (float) {
				return parseFloat(value);
			}

			return parseInt(value);
		},

		value: function() {
			return this.normalNumber($(this.element).val(), $(this.element).attr('data-float')) || 0;
		},

		__onKeyUp: function(e) {
			var cursorPosition = e.currentTarget.selectionStart;

			if (e.shiftKey || e.ctrlKey || e.keyCode == 16 || e.keyCode == 17 || (e.keyCode >= 37 && e.keyCode <= 40)) {
				return;
			}

			e.currentTarget.value = this.formatNumber(e.currentTarget.value);

			var value = e.currentTarget.value.toString();
			var cursorShift = value.length - this.oldValue.length;

			if (cursorShift < 0) {
				cursorShift += 1;

				if (cursorPosition == 0) {
					cursorShift = 0;
				}
			} else if (cursorShift > 0) {
				cursorShift -= 1;
			}

			e.currentTarget.setSelectionRange(cursorPosition + cursorShift, cursorPosition + cursorShift);
		},

		__onKeyDown: function(e) {
			this.oldValue = e.currentTarget.value.toString();
			var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
			var input = $(e.currentTarget);

			if (input.attr('data-float')) { // Допускать ввод дробных чисел
				keys.push('.');

				if (e.key == '.' && this.oldValue.indexOf('.') >= 0) {
					e.preventDefault();
					return;
				}
			}

			if (input.attr('data-negative')) { // Допускать ввод отрицательных чисел
				keys.push('-');
			}

			if ($.inArray(e.keyCode, [46, 8, 9, 27, 13]) != -1 || (e.keyCode >= 37 && e.keyCode <= 40) || e.shiftKey || e.ctrlKey || e.keyCode == 16 || e.keyCode == 17)
				return;

			if ($.inArray(e.key, keys) == -1) {
				e.preventDefault();
			}
		},

		__onChange: function(e) {
			var input = $(e.currentTarget);
			var isFloat = input.attr('data-float');

			var value = this.normalNumber(input.val(), isFloat ? true : false);
			var minValue = parseFloat(input.attr('data-min'));
			var maxValue = parseFloat(input.attr('data-max'));

			if (value < minValue) {
				e.currentTarget.value = this.formatNumber(minValue);
			}

			if (value > maxValue) {
				e.currentTarget.value = this.formatNumber(maxValue);
			}

			if (isFloat) {
				e.currentTarget.value = this.formatNumber(e.currentTarget.value);
			}
		}
	});

	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName, new Plugin(this, options));
			}
		});
	};
})(jQuery);

// Применяем плагин для того, чтобы числа в input-ах представлять в виде Х ХХХ ХХХ
$('.js-prettyNumbers').prettyNumber();