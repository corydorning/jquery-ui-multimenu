/*! jquery.ui.multimenu.js
 *
 * URL: http://corydorning.com/projects/multimenu
 *
 * @author: Cory Dorning
 * @modified: 10/30/2014
 *
 * dependencies: jQuery 1.9+, jQuery UI 1.9+
 *
 * multimenu is a jQuery UI widget that transforms a
 * list of checkboxes/radio buttons and adds them
 * into a dropdown widget to provide a better User
 * Experience when you need to select multiple items,
 * without the need to use the <select> element and
 * the CTRL key.
 *
 */


;(function($) {
  "use strict";

  var multimenuID = 0,
      $doc = $(document);

  jQuery.expr[':'].icontains = function(a, i, m) {
    return jQuery(a).text().toLowerCase()
      .indexOf(m[3].toLowerCase()) >= 0;
  };

  $.widget('ui.multimenu', {
    _version: "v1.0.1",

    version: function() { return this._version; },
  
    // default options
    options: {
      autoOpen: false,                          // works
      disabled: false,                          // works
      hide: null,                               // works
      show: null,                               // works

      menuHeight: 200,                          // works
      minMenuWidth: 260,                        // works

      noneSelectedText: '-- Select Options --', // works
      selectedList: 0,
      selectedText: '# selected',               // works
      minButtonWidth: 200,                      // works


      header: true,                             // works
      selectAll: true,
      selectAllText: 'Select All',              // works
      search: true,
      scrollDelay: 200,

      leafNodes: false
    },

    _create: function() {
      // create a unique namespace for events that the widget
      // factory cannot unbind automatically.
      this._namespaceID = this.eventNamespace;

      // set options via HTML5 data
      $.extend(this.options, this.element.data('options'));

      var self = this,
          o = self.options,
          $el = self.element,


      // create button, insert before plugin element
      $button = (self.$button = $('<button type="button"></button>'))
        .text(o.noneSelectedText)
        .addClass('ui-multimenu')
        .button({
          icons: { secondary: 'ui-icon-triangle-1-s' }
         })
        .insertBefore($el),

      // create checkbox menu and hide
      $menu = self.$menu = $('<div/>')
          .addClass('ui-multimenu-menu ui-helper-reset ui-widget ui-widget-content ui-corner-all')
          .hide()
          .append(self.$menuItems = $el.addClass('ui-multimenu-menu-items ui-helper-reset'))
          .insertAfter($button),

      // create menu header
      $header = (self.$header = $('<div/>'))
        .addClass('ui-widget-header ui-corner-all ui-multimenu-header ui-helper-clearfix')
        .prependTo($menu),

      // create header links
      $headerLinkContainer = (self.$headerLinkContainer = $('<ul />'))
        .addClass('ui-helper-reset')
        .append(function() {
          if(typeof o.header === "string") {
            return '<li>' + o.header + '</li>';
          } else if(o.header) {
            var headerHTML = '';

            if (o.selectAll) {
              headerHTML += '<li class="ui-multimenu-all"><label><input type="checkbox"> ' + o.selectAllText + '</label></li>';
            }

            if (o.search) {
              headerHTML += '<li class="ui-multimenu-search"><label><input type="text" placeholder="Search..."></label></li>';
            }

            return headerHTML;
          } else {
            return '';
          }
        })
        .appendTo($header);

      // perform event bindings
      self._bindEvents();

      // widget specifics
      self.refresh();
      self.update();

      // bump unique ID
      multimenuID++;

    }, // _create method

    _init: function() {
      var self = this,
          o = self.options;

      if(o.header === false) {
        this.$header.hide();
      }
      if(o.autoOpen) {
        self.open();
      }
      if(o.disabled) {
        self.disable();
      }
    }, // _init method


    // binds events
    _bindEvents: function() {
      var self = this,

          // button dropdown menu
          $button = self.$button,

          // checkbox menu
          $menuItems = self.$menuItems,

          // menu header
          $header = self.$header,

          // open or close menu
          clickHandler = function() {
            self[ self._isOpen ? 'close' : 'open' ]();
            return false;
          };

      // button events
      $button.on({
        // open or close
        click: clickHandler,

        // states
        'focus mouseenter': function() {
          if(!$button.hasClass('ui-state-disabled')) {
            $(this).addClass('ui-state-hover');
          }
        },
        'mouseleave blur': function() {
          $(this).removeClass('ui-state-focus');
        }
      }); // end $button events


      // header events
      $header
        .on('click.multimenu', ':checkbox', function(e) {
          self[$(this).is(':checked') ? 'checkAll' : 'uncheckAll']();
        })
        .on({
           'keydown.multimenu': function(e) {
             // prevent the enter key from submitting the form / closing the widget
             if(e.which === 13) {
               e.preventDefault();
             }
           },
           'keyup.multimenu': $.proxy(self._handler, self)
        }, '.ui-multimenu-search input', function() {

        });
      // end $header events


      // menu item events
      $menuItems
        .on('mouseenter.multimenu', 'label', function() {
          if(!$(this).hasClass('ui-state-disabled')) {
            self.$labels.removeClass('ui-state-hover');
            $(this).addClass('ui-button ui-corner-all ui-state-hover').find('input').focus();
          }

          // callback event
          self._trigger('checkboxtoggle');
        })
        .on('click.multiselect', ':checkbox, :radio', function() {
          self.update();
        }); // end $menu events


      // close each widget when clicking on any other element/anywhere else on the page
      $doc.on('mousedown.' + this._namespaceID, function(event) {
        var target = event.target;

        if(self._isOpen && target !== self.$button[0] && target !== self.$menu[0] && !$.contains(self.$menu[0], target) && !$.contains(self.$button[0], target)) {
          self.close();
        }
      });

    }, // _bindEvents method

    _handler: function(e) {
      var self = this,
          term = $.trim(e.target.value.toLowerCase()),
          $items = self.$menuItems.find('label');

      if (term) {
        $items
          .removeClass('ui-multimenu-hilite')
          .filter(':icontains(' + term + ')')
          .addClass('ui-multimenu-hilite');
      } else {
        $items
          .removeClass('ui-multimenu-hilite');
      }

      self.$menuItems.animate({
        scrollTop: (self.$menuItems.find('.ui-multimenu-hilite').length ? self.$menuItems.find('.ui-multimenu-hilite').get(0).offsetTop : 0)
      }, self.options.scrollDelay);
    },

    // this exists as a separate method so that the developer
    // can easily override it.
    _setButtonValue: function(value) {
      this.$button.find('.ui-button-text').text(value);
    },

    // set button width
    _setButtonWidth: function() {
      var self = this,
          width = self.$button.outerWidth(),
          o = self.options;

      if(/\d/.test(o.minButtonWidth) && width < o.minButtonWidth) {
        width = o.minButtonWidth;
      }

      // set widths
      self.$button.outerWidth(width);
    },

    // set menu width
    _setMenuWidth: function() {
      var self = this,

          // reset outerwidth first, then get actual value
          width = self.$menu.css('width', 'auto').outerWidth() + 10,
          o = self.options;

      if(/\d/.test(o.minMenuWidth) && width < o.minMenuWidth) {
        width = o.minMenuWidth;
      }

      // set widths
      self.$menu.outerWidth(width);
    },

    // This is an internal function to toggle the checked property and
    // other related attributes of a checkbox.
    _toggleState: function(prop, flag) {
      return function() {
        if(!this.disabled && this[prop] !== flag) {
          this[prop] = flag;
          $(this).trigger('change');
        }

        if(flag) {
          this.setAttribute('aria-selected', true);
        } else {
          this.removeAttribute('aria-selected');
        }
      };
    },

    _toggleChecked: function(flag) {
      var $inputs = this.$inputs;
      var self = this;

      // remove any indeterminate states
      $inputs.prop('indeterminate', false);

      // toggle state on inputs
      $inputs.each(this._toggleState('checked', flag));
    },

    // open the menu
    open: function() {
      var self = this,
          o = self.options,
          effect = o.show,
          speed = self.speed,
          $button = self.$button,
          $menu = self.$menu,

          // reset the scroll of the checkbox container
          // and set height so menuHeight can be calculated
          $container = self.$menuItems.scrollTop(0).height(o.menuHeight),

          // values are needed to see if menu is below the fold
          buttonHeight = $button.outerHeight(),
          menuHeight = $menu.outerHeight(),
          windowHeight = $(window).height(),
          windowScrollTop = $(window).scrollTop(),
          buttonOffsetTop = self.$button.offset().top,
          trueMenuHeight = buttonHeight + menuHeight,
          menuFold = buttonOffsetTop  + trueMenuHeight,
          pageBottomFold =  windowScrollTop + windowHeight,
          pageTopFold =  buttonOffsetTop - windowScrollTop,

          // placebolder for jquery show function
          args = [];

      // bail if the multimenuopen event returns false, this widget is disabled, or is already open
      if($button.hasClass('ui-state-disabled') || self._isOpen) {
        return;
      }


      // figure out opening effects/speeds
      if($.isArray(effect)) {
        effect = o.show[0];
        speed = o.show[1] || self.speed;
      }

      // if there's an effect, assume jQuery UI is in use
      // build the arguments to pass to show()
      if(effect) {
        args = [ effect, speed ];
      }

      if(menuFold > pageBottomFold && trueMenuHeight < pageTopFold) {
        console.log('menu is below the fold', menuHeight, $menu.outerHeight(), $menu.innerHeight(), buttonHeight);
        $menu.css('margin-top', '-' + (menuHeight + buttonHeight + 2) + 'px')
      } else {
        $menu.css('margin-top', 0);
      }

      // show the menu, maybe with a speed/effect combo
      $.fn.show.apply($menu, args);

      // set state
      $button.addClass('ui-state-active');
      self._isOpen = true;
    },

    // close the menu
    close: function() {
      var self = this,
        o = self.options,
        effect = o.show,
        speed = self.speed,
        $button = self.$button,
        $menu = self.$menu,
        args = [];

      // figure out opening effects/speeds
      if($.isArray(o.hide)) {
        effect = o.hide[0];
        speed = o.hide[1] || self.speed;
      }

      if(effect) {
        args = [ effect, speed ];
      }

      // hide the menu, maybe with a speed/effect combo
      $.fn.hide.apply($menu, args);

      // set state
      $button.removeClass('ui-state-active').trigger('blur').trigger('mouseleave');
      self._isOpen = false;
    },

    update: function() {
      var o = this.options,
          $selectAll = this.$header.find(':checkbox'),
          $inputs = this.$inputs,
          $checked = $inputs.filter(':checked'),
          numChecked = $checked.length,
          leafTotal = 0,
          value;

      if(o.leafNodes) {
        // reset numChecked
        numChecked = 0;

        $inputs.each(function() {
          if(!$(this).parents('li').first().find('ul').length) {
            leafTotal++;

            // add to leaf node numChecked
            if($(this).is(':checked')) {
              numChecked++;
            }
          }
        });
      }

      if(numChecked === 0) {
        value = o.noneSelectedText;
      } else {
        if($.isFunction(o.selectedText)) {
          value = o.selectedText.call(this, numChecked, $inputs.length, $checked.get());
        } else if(/\d/.test(o.selectedList) && o.selectedList > 0 && numChecked <= o.selectedList) {
          value = $checked.map(function() { return $(this).parent().text(); }).get().join(', ');
        } else {
          value = o.selectedText.replace('#', numChecked).replace('#', leafTotal || $inputs.length);
        }
      }

      $selectAll.prop('checked', numChecked === (leafTotal || $inputs.length) && $selectAll);


      this._setButtonValue(value);

      return value;
    },

    enable: function() {
      this.$button.button({ disabled: false });
    },

    disable: function() {
      this.$button.button({ disabled: true });
    },

    checkAll: function(e) {
      this._toggleChecked(true);
      this.update();
    },

    uncheckAll: function() {
      this._toggleChecked(false);
      this.update();
    },

    refresh: function() {
      var self = this,
        $menuItems = self.$menuItems;

      // store checkboxes and labels
      self.$inputs = self.$menuItems.find(':checkbox, :radio');
      self.$labels = self.$menuItems.find('label');

      // formatting
      $menuItems
        .find('ul')
        .css('list-style', 'none');

      // options
      // set widths
      self._setButtonWidth();
      self._setMenuWidth();

    } // refresh method

  }); // $.widget('multimenu')
})(jQuery);
// end multimenu