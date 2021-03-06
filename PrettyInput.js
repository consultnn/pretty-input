'use strict';

const PrettyFormatter = {
	format(number, entireLimit = 0, decimalLimit = 0) {
		number = number.toString().replace(/\s+/g, "");

		if (number.indexOf('.') > -1 || number.indexOf(',') > -1) {
			number = number.split(/[\.,]/);

			if (entireLimit > 0) {
				number[0] = number[0].substring(number[0].length - entireLimit - 1);
			}

			if (decimalLimit > 0) {
				number[1] = number[1].substring(0, decimalLimit);
			}

			let entire = number[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
			let decimal = number.length > 1 ? '.' + number[1] : '';

			return entire + decimal;
		} else {
			if (entireLimit > 0) {
				number = number.substring(0, entireLimit);
			}
			number = parseInt(number);
		}
		return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	},
	unformat(number, makeFloat = false) {
		let value = number.replace(/\s/g, '');
		return makeFloat ? parseFloat(value) : parseInt(value);
	}
};

let PrettyInputInstances = [];

export default class PrettyInput {
	constructor(element, options = {}) {
		if (element == null) {
			throw new Error('PrettyNumbers: empty element');
		}

		if (element.tagName.toLowerCase() != 'input') {
			throw new Error('PrettyNumbers: element tag must be <input>');
		}

		this.__input = element;
		this.__isFloat = options.float || this.__input.dataset.float || false;
		this.__isNegative = options.negative || this.__input.dataset.negative || false;
		this.__min = options.min || this.__input.dataset.min || null;
		this.__max = options.max || this.__input.dataset.max || null;
		this.__entireLimit = options.entireLimit || this.__input.dataset.entireLimit || 0;
		this.__decimalLimit = options.decimalLimit || this.__input.dataset.decimalLimit || 0;
		this.__onChangeCallback = options.onChange || null;
		this.__oldValue = '';

		if (this.__input.value) {
			this.__input.value = PrettyFormatter.format(this.__input.value, this.__entireLimit, this.__decimalLimit);
		}

		this.__input.addEventListener('keydown', this.__onKeyDown.bind(this));
		this.__input.addEventListener('keyup', this.__onKeyUp.bind(this));
		this.__input.addEventListener('change', this.__onChange.bind(this));
		this.__input.addEventListener('focus', this.__onFocus.bind(this));
		this.__input.addEventListener('click', this.__onClick.bind(this));
		PrettyInputInstances.push(this);
	}

	get input() {
		return this.__input;
	}

	get value() {
		if (this.__input.value.toString().length > 3) {
			return PrettyFormatter.unformat(this.input.value, this.isFloat);
		}
		return this.input.value;
	}

	get formattedValue() {
		return this.input.value;
	}

	get isFloat() {
		return Boolean(this.__isFloat);
	}

	get isNegative() {
		return Boolean(this.__isNegative);
	}

	get min() {
		return parseFloat(this.__min);
	}

	get max() {
		return parseFloat(this.__max);
	}

	get dataset() {
		return {
			float: this.isFloat,
			negative: this.isNegative,
			min: this.min,
			max: this.max
		}
	}

	get isPrettyInput() {
		return true;
	}

	set value(newValue) {
		if(newValue === '' || newValue === null) {
			this.input.value = '';
		} else if (newValue.toString().length > 3) {
			this.input.value = PrettyFormatter.format(newValue, this.__entireLimit, this.__decimalLimit);
		} else {
			this.input.value = parseInt(newValue);
		}

		this.input.dispatchEvent(new Event('change', { bubbles: true }));
	}

	set isFloat(value) {
		this.__isFloat = Boolean(value);
		this.input.dataset.float = this.isFloat;
	}

	set isNegative(value) {
		this.__isNegative = Boolean(value);
		this.input.dataset.negative = this.isNegative;
	}

	set min(value) {
		if (this.max && value < this.max) {
			this.__min = parseFloat(value);
			this.__checkRange();
		} else if (this.max && this.min >= this.max) {
			throw new Error('PrettyInput: min must be less than max');
		}
	}

	set max(value) {
		if (this.max && value > this.min) {
			this.__max = parseFloat(value);
			this.__checkRange();
		} else if (this.max && this.max <= this.min) {
			throw new Error('PrettyInput: max must be more than min');
		}
	}

	get onChange() {
		return this.__onChangeCallback;
	}

	set onChange(func) {
		this.__onChangeCallback = func;
	}

	setValueWithoutEvents(newValue) {
		if (newValue.toString().length > 3) {
			this.input.value = PrettyFormatter.format(newValue, this.__entireLimit, this.__decimalLimit);
		} else {
			this.input.value = parseInt(newValue);
		}
	}

	static create(input) {
	    return PrettyInput.find(input) || new PrettyInput(input)
    }

	static find(input) {
		return PrettyInputInstances.find(pretty => pretty.input === input) || null;
	}

	__onKeyDown(e) {
		let keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
		const allowedKeys = [8, 9, 35, 36, 46]; //Backspace, Tab, Home, End, Del

		const isLeft = e.keyCode == 37;
		const isRight = e.keyCode == 39;
		const isBackspace = e.keyCode == 8;
		const isDel = e.keyCode == 46;
		const formattedValue = this.formattedValue;
		const cursorPosition = e.currentTarget.selectionStart;

		this.__oldValue = this.input.value;

		if (isLeft || isRight) {
			let cursorShift = 0;
			e.preventDefault();

			if (cursorPosition > 0 && isLeft) {
				cursorShift--;
				if (cursorPosition > 0 && formattedValue.charAt(cursorPosition - 1) == ' ') {
					cursorShift--;
				}
			} else if (cursorPosition <= formattedValue.length && isRight) {
				cursorShift++;
				if (formattedValue.charAt(cursorPosition + 1) == ' ') {
					cursorShift++;
				}
			}

			if (cursorShift != 0) {
				this.input.setSelectionRange(cursorPosition + cursorShift, cursorPosition + cursorShift);
				return;
			}
		}

		if (isBackspace && formattedValue.charAt(cursorPosition - 1) == ' ') {
			this.input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
			return;
		}

		if (isDel && formattedValue.charAt(cursorPosition) == ' ') {
			this.input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
			return;
		}

		if (allowedKeys.indexOf(e.keyCode) > -1) {
			return;
		}

		if (this.isFloat) {
			keys.push('.', ',');

			if ((e.key == '.' || e.key == ',') && this.formattedValue.indexOf('.') > -1) {
				e.preventDefault();
				return;
			}
		}

		if (this.isNegative) {
			keys.push('-');

			if (e.key == '-' && this.formattedValue.indexOf('-') > -1 && this.formattedValue.length > 0) {
				e.preventDefault();
				return;
			}
		}

		if (!keys.includes(e.key)) {
			e.preventDefault();
		}
	}

	__onKeyUp(e) {
		const oldFormattedValue = this.__oldValue;
		const cursorPosition = e.currentTarget.selectionStart;
		var prettyFormattedValue = PrettyFormatter.format(this.input.value, this.__entireLimit, this.__decimalLimit);
		this.input.value = prettyFormattedValue != 'NaN' ? prettyFormattedValue : '';
		const newFormattedValue = this.formattedValue;

		const isBackspace = e.keyCode == 8;
		let cursorShift = 0;

		let oldValueSpaces = PrettyInput.__spacesBeforeCursor(oldFormattedValue.slice(0, cursorPosition));
		let newValueSpaces = PrettyInput.__spacesBeforeCursor(newFormattedValue.slice(0, cursorPosition));

		cursorShift += newValueSpaces - oldValueSpaces;

		if (isBackspace) {
			if (newFormattedValue.charAt(cursorPosition + cursorShift - 1) == ' ') {
				cursorShift--;
			}
		}

		this.input.setSelectionRange(cursorPosition + cursorShift, cursorPosition + cursorShift);
	}

	__checkRange() {
		let value = this.value;
		if (this.min && (!value || value < this.min)) {
			this.value = this.min || '';
		}

		if (this.max != null && value > this.max) {
			this.value = this.max;
		}
	}

	__onChange() {
		this.__checkRange();

		if (this.__onChangeCallback) {
			this.__onChangeCallback(this);
		}
	}

	__onFocus() {
		this.input.setSelectionRange(-1, -1);
	}

	__onClick() {
		const cursorPosition = this.input.selectionStart;

		if (this.formattedValue.charAt(cursorPosition) == ' ') {
			this.input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
		}
	}

	static __spacesBeforeCursor(str) {
		var result = str.split(' ').length - 1;
		return result > 0 ? result : 0;
	}
}