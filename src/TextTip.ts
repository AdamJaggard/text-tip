import './TextTip.css';

enum IconFormat {
	URL = 'url',
	SVGSprite = 'svgsprite',
	Font = 'font'
};

interface Button {
	title: string,
	icon: string,
	callback: Function
};

interface Config {
	scope?: HTMLElement | string
	minLength?: number,
	maxLength?: number,
	iconFormat?: IconFormat,
	buttons: Button[],
	theme?: 'none' | 'default',
	mobileOSBehaviour?: 'hide' | 'normal'
	on?: {
		show?: Function,
		hide?: Function
	}
};

export default class TextTip {
	config: Config = {
		scope: 'body',
		minLength: 1,
		maxLength: Infinity,
		iconFormat: IconFormat.URL,
		buttons: [],
		theme: 'default',
		mobileOSBehaviour: 'hide'
	};
	scopeEl: HTMLElement;
	tipEl: HTMLElement;
	tipWidth: number;
	id: number;
	open: boolean = false;
	isMobileOS: boolean = false;

	static instanceCount: number = 0;

	constructor(config: Config) {
		if (typeof window.getSelection === 'undefined') {
			throw new Error('TextTip: Selection api not supported in this browser');
		}

		if (typeof config !== 'object') {
			throw new Error('TextTip: No config supplied');
		}
		
		Object.assign(this.config, config);

		if (typeof config.buttons === 'undefined') {
			throw new Error('TextTip: No buttons supplied');
		}

		this.isMobileOS = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
		this.id = TextTip._getID();

		// Hide on mobile OS's, they have their own conflicting tooltips
		if (this.config.mobileOSBehaviour === 'hide' && this.isMobileOS) return;

		this._setupScope();
		this._setupTooltip()
		this._setupEvents();
	};

	_setupScope = () => {
		if (typeof this.config.scope === 'string') {
			this.scopeEl = document.querySelector(this.config.scope);
		}

		if (!this.scopeEl) {
			throw new Error('TextTip: Cannot find supplied scope');
		}

		this.scopeEl.setAttribute('data-texttip-scope-id', this.id.toString());
	};

	_setupTooltip = () => {
		const inner = document.createElement('div');
		inner.classList.add('texttip__inner');

		this.config.buttons.forEach((btn, index) => {
			const btnEl = document.createElement('div');
			
			btnEl.classList.add('texttip__btn');
			btnEl.setAttribute('role', 'button');
			btnEl.setAttribute('data-texttip-btn-index', index.toString());
			btnEl.style.transitionDelay = (40 * (index + 1)) + 'ms';
			
			// Render specific markup for the different icon formats
			switch (this.config.iconFormat) {
				case IconFormat.URL:
					btnEl.innerHTML = `<img src="${btn.icon}" alt="${btn.title}">`;
					break;
				case IconFormat.SVGSprite:
					btnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" title="${btn.title}" pointer-events="none"><use xlink:href="${btn.icon}"></use></svg>`;
					break;
				case IconFormat.Font:
					btnEl.innerHTML = `<i class="${btn.icon}" title="${btn.title}"></i>`;
					break;
			}
			
			inner.appendChild(btnEl);
		});
		
		const tooltip = document.createElement('div');
		tooltip.classList.add('texttip', 'texttip--theme-' + this.config.theme);
		tooltip.setAttribute('data-textip-iconformat', this.config.iconFormat);
		tooltip.setAttribute('data-texttip-id', this.id.toString());
		tooltip.setAttribute('role', 'tooltip');
		tooltip.setAttribute('aria-hidden', 'true');
		tooltip.appendChild(inner);
		
		document.body.appendChild(tooltip);
		
		this.tipEl = tooltip;
		this.tipWidth = this.tipEl.offsetWidth;
	};

	_setupEvents = () => {
		document.addEventListener('selectionchange', this._onSelectionChanged);

		this.tipEl.querySelectorAll('.texttip__btn').forEach((btn, index) => {
			btn.addEventListener('click', this._onButtonClick);
		});
	};

	_setButtons = (buttons: Button[]) => {
		this.config.buttons = buttons;
	};

	_onSelectionChanged = (event: Event) => {
		if (this._selectionValid()) {
			this._updatePosition();
			this._show();
		} else {
			this._hide();
		}
	};

	_selectionValid = () => {
		const selection = window.getSelection();
		const selStr = selection.toString();
		const selLength = selStr.length;

		if (selLength < this.config.minLength || selLength > this.config.maxLength) {
			return false;
		}

		const anchorNodeParent = selection.anchorNode.parentElement;
		const focusNodeParent = selection.focusNode.parentElement;

		if (!anchorNodeParent || !focusNodeParent) return false;

		const anchorParent = anchorNodeParent.closest(`[data-texttip-scope-id="${this.id}"]`);
		const focusParent = focusNodeParent.closest(`[data-texttip-scope-id="${this.id}"]`);

		// Selection must start and end within specified scope
		return anchorParent && focusParent;
	};

	_updatePosition = () => {
		const selection = window.getSelection();

		// Allows us to measure where the selection is on the page relative to the viewport
		const range = selection.getRangeAt(0);

		const { top: selTop, left: selLeft, width: selWidth } = range.getBoundingClientRect();
		
		// Middle of selection width
		let newTipLeft = selLeft + (selWidth / 2) - window.scrollX;

		// Right above selection 
		let newTipBottom = window.innerHeight - selTop - window.scrollY;

		// Stop tooltip bleeding off of left or right edge of screen
		// Use a buffer of 20px so we don't bump right against the edge
		// The tooltip transforms itself left minus 50% of it's width in css
		// so this will need to be taken into account

		const buffer = 20;
		const tipHalfWidth = this.tipWidth / 2;

		// "real" means after taking the css transform into account
		const realTipLeft = newTipLeft - tipHalfWidth;
		const realTipRight = realTipLeft + this.tipWidth;

		if (realTipLeft < buffer) {
			// Correct for left edge overlap
			newTipLeft = buffer + tipHalfWidth;
		} else if (realTipRight > window.innerWidth - buffer) {
			// Correct for right edge overlap
			newTipLeft = window.innerWidth - buffer - tipHalfWidth;
		}

		this.tipEl.style.left = newTipLeft + 'px';
		this.tipEl.style.bottom = newTipBottom + 'px';
	};

	_onButtonClick = (event: Event) => {
		event.preventDefault();
		const btn = <HTMLElement> event.currentTarget;
		const btnIndex = parseInt(btn.getAttribute('data-texttip-btn-index'), 10);
		const selection = window.getSelection();
		this.config.buttons[btnIndex].callback(selection.toString());
	}

	_show = () => {
		if (this.open) return;
		
		this.open = true;
		this.tipEl.classList.add('texttip--show');
		this.tipEl.setAttribute('aria-hidden', 'true');

		// Callback
		if (this.config.on && typeof this.config.on.show === 'function') this.config.on.show();
	};

	_hide = () => {
		if (!this.open) return;
		
		this.open = false;
		this.tipEl.classList.remove('texttip--show');
		this.tipEl.setAttribute('aria-hidden', 'false');

		// Callback
		if (this.config.on && typeof this.config.on.hide === 'function') this.config.on.hide();
	};

	static _getID = () => ++TextTip.instanceCount;
};
