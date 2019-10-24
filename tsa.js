var Drupal = Drupal || { 'settings': {}, 'behaviors': {}, 'locale': {} };
var tsaPrecheckFormSettings = {};

(function ($) {

/**
 * Process form changes into the tsaPrecheckFormSettings variable
 */
Drupal.tsaPrecheckScheduleFormChange = function(element) {
  console.log(element);
}

/**
 * we have all the information we need to show the data, fetch data and show it.
 */
Drupal.tsaPrecheckScheduleUpdate = function() {
  var address = Drupal.settings.basePath + 'api/checkpoints/v1/data/' + tsaPrecheckFormSettings.airport + '/' + tsaPrecheckFormSettings.day + '.json';
  $('#precheck-checkpoint-schedule-results').attr('aria-busy', 'true').empty();
  $('#precheck-checkpoint-schedule-noresults').attr('aria-busy', 'true').css('display','none');

  // fetch the data
  $.getJSON(address, function(data) {
    var results = '<table class="results"><caption>' + Drupal.t('Updated Every Monday') + '</caption>';
    tsaPrecheckFormSettings.time = parseInt(tsaPrecheckFormSettings.time);
    results += Drupal.tsaPrecheckScheduleHourCreate(data, tsaPrecheckFormSettings.time);
    results += Drupal.tsaPrecheckScheduleHourCreate(data, tsaPrecheckFormSettings.time + 1);

    // Return the results to the DOM
    $('#precheck-checkpoint-schedule-results').html(results);

    // let the data be read by a screen reader
    $('#precheck-checkpoint-schedule-results').attr('aria-busy', 'false');
  })
  // When there are no results returned. (The .getJSON call fails because the airport code does not match)
  .fail(function() {
    // Display the 'No-Results' block
    $('#precheck-checkpoint-schedule-noresults').css('display','block');

    // let the data be read by a screen reader
    $('#precheck-checkpoint-schedule-noresults').attr('aria-busy', 'false');
  });

  Drupal.attachBehaviors();
};

/**
 * from the data returned from the $.getJSON request and the chosen hour create
 * the rows for the table
 */
Drupal.tsaPrecheckScheduleHourCreate = function(data, hour) {
  var terminal = {},
      checkpoint = {},
      status = '',
      position = '',
      count = 0;
  var rows = '<tr class="hour-label"><td colspan="3">' + Drupal.tsaPrecheckScheduleCreateHourLabel(hour) + ' - ' + Drupal.tsaPrecheckScheduleCreateHourLabel(hour + 1) + '</td></tr>';

  for (var i in data.terminals) {
    if (data.terminals.hasOwnProperty(i)) {
      terminal = data.terminals[i];
      for (var j in terminal.checkpoints) {
        if (terminal.checkpoints.hasOwnProperty(j)) {
          checkpoint = terminal.checkpoints[j];
          status = (typeof checkpoint.hours[hour] !== 'undefined' && checkpoint.hours[hour] == 'open') ? 'open' : 'closed';
          if (status !== 'closed') {
            count += 1;
            rows += '<tr class="data-row ' + position + '">' +
                    '<td class="terminal-name">' + terminal.terminal_name + '</td>' +
                    '<td class="checkpoint-name">' + Drupal.t('@checkpoint', {'@checkpoint': checkpoint.checkpoint_name}) + '</td>' +
                    '<td class="operation-status status-' + status + '">' + status + '</td>' +
                  '</tr>';
          }
        }
      }
    }
  }
  if (count <= 0) {
    rows += '<tr class="data-row ' + position + '">' +
              '<td class="all-closed" colspan="3">' + Drupal.settings.tsaPrecheck.checkPointHours.allClosedText + '</td>' +
            '</tr>';
  }
  return rows;
};

/**
 * from the huour integer figure out how it should be displayed to the user
 */
Drupal.tsaPrecheckScheduleCreateHourLabel = function(hour) {
  var label = '';

  if (hour < 12  && hour > 0) {
    label =  hour + 'am';
  }
  else if (hour === 12) {
    label =  hour + 'pm';
  }
  else if (hour === 0 || hour === 24) {
    label = '12am';
  }
  else if (hour < 24) {
    label = (hour - 12) + 'pm';
  }
  else {
    label = Drupal.tsaPrecheckScheduleCreateHourLabel(hour - 24);
  }
  return label;
};

$(document).ready(function() {

});

Drupal.behaviors.tsaPrecheckSchedule = {
  attach: function(context) {
    $('#tsa-precheck-checkpoint-hours-form select:not(.tps-processed)', context)
      .addClass('tps-processed')
      .chosen({
        width: '100%',
        disable_search: true,
    });

    $('#tsa-precheck-checkpoint-hours-form #edit-airport:not(.tps-processed)', context)
      .addClass('tps-processed')
      .autocomplete({
        source: function(request, response) {
          $('#tsa-precheck-checkpoint-hours-form .throbber-image')
            .attr('src', Drupal.settings.basePath + 'misc/throbber-active.gif')
            .attr('alt', Drupal.t('Spinner image - active - currently searching'));
          $('#tsa-airport-error').css('visibility','hidden');
          $.getJSON(Drupal.settings.basePath + 'api/checkpoints/v1/airports.json', {
            term: request.term,
            page_limit: 10
          }, function(data) {
            var array = data.error ? [] : $.map(data, function(item) {
              item.value = Drupal.t('@airport (@code)', {'@airport' : item.airport_name, '@code': item.airport_code});
              item.label = item.value;
              return item;
            });
            if (data.length == 0) {
              $('#tsa-airport-error').css('visibility','visible');
            }
            $('#tsa-precheck-checkpoint-hours-form .throbber-image')
              .attr('src', Drupal.settings.basePath + 'misc/throbber-inactive.png')
              .attr('alt', Drupal.t('Spinner image - inactive - search idle'));
            response(array);
          });
        },
        change: function() {
			console.log('hello');
          Drupal.tsaPrecheckScheduleFormChange(this);
        },
      });
    $('#tsa-precheck-checkpoint-hours-form .form-item-airport label:not(.tps-processed)')
      .addClass('tps-processed')
      .after('<img class="throbber-image" src="' + Drupal.settings.basePath + 'misc/throbber-inactive.png" alt="Spinner image - inactive - search idle"/>');
    $('#tsa-precheck-checkpoint-hours-form #edit-airport', context)
      .data( 'ui-autocomplete' )._renderItem = function( ul, item ) {
        return $( '<li>' )
        .append( '<a class="tsaprecheck-airports"><span class="airport-location">' + item.city + ', ' + item.state + '</span><br><span class="airport-label">' + item.airport_name + ' (' + item.airport_code + ')' + '</span></a>' )
        .appendTo( ul );
      };

    $('#tsa-precheck-checkpoint-hours-form input:not(.tpcs-processed), #tsa-precheck-checkpoint-hours-form select:not(.tpcs-processed)')
      .addClass('tpcs-processed')
      .change(function() {
        Drupal.tsaPrecheckScheduleFormChange(this);
    });

    $('#tsa-precheck-checkpoint-hours-form .form-submit:not(.tpcs-submit-processed)')
      .addClass('tpcs-submit-processed')
      .click(function(e) {console.log('clicked');
        e.preventDefault();
        e.stopPropagation();
        // check to see if we have all the information we need
        if (typeof tsaPrecheckFormSettings.airport !== 'undefined' &&
            tsaPrecheckFormSettings.airport &&
            typeof tsaPrecheckFormSettings.day !== 'undefined' &&
            tsaPrecheckFormSettings.day &&
            typeof tsaPrecheckFormSettings.time !== 'undefined' &&
            tsaPrecheckFormSettings.time !== null) {
          // we have the three pieces of information we need
          // Remove any validation styles
          $('#edit-airport, #edit-day, #edit_day_chosen a, #edit-time, #edit_time_chosen a').removeClass('tsa-precheck-checkpoint-missing-field');
          $('.tsa-precheck-checkpoint-field-error').css('visibility','hidden');
          // Execute Update
          Drupal.tsaPrecheckScheduleUpdate();
        } else {
          if (typeof tsaPrecheckFormSettings.airport === 'undefined' ||
            !tsaPrecheckFormSettings.airport) {
            $('#edit-airport').addClass('tsa-precheck-checkpoint-missing-field');
            $('.form-item-airport .tsa-precheck-checkpoint-field-error').css('visibility','visible');
          } else {
            $('#edit-airport').removeClass('tsa-precheck-checkpoint-missing-field');
            $('.form-item-airport .tsa-precheck-checkpoint-field-error').css('visibility','hidden');
          }
          if (typeof tsaPrecheckFormSettings.day === 'undefined' ||
            !tsaPrecheckFormSettings.day) {
            $('#edit_day_chosen a').addClass('tsa-precheck-checkpoint-missing-field');
            $('.form-item-day .tsa-precheck-checkpoint-field-error').css('visibility','visible');
          } else {
            $('#edit_day_chosen a').removeClass('tsa-precheck-checkpoint-missing-field');
            $('.form-item-day .tsa-precheck-checkpoint-field-error').css('visibility','hidden');
          }
          if (typeof tsaPrecheckFormSettings.time === 'undefined' ||
            !tsaPrecheckFormSettings.time) {
            $('#edit_time_chosen a').addClass('tsa-precheck-checkpoint-missing-field');
            $('.form-item-time .tsa-precheck-checkpoint-field-error').css('visibility','visible');
          } else {
            $('#edit_time_chosen a').removeClass('tsa-precheck-checkpoint-missing-field');
            $('.form-item-time .tsa-precheck-checkpoint-field-error').css('visibility','hidden');
          }
        }
    });
  },
};

})(jQuery);
