<?php

/**
 * @file
 * Customize the display of a complete webform.
 *
 * This file may be renamed "webform-form-[nid].tpl.php" to target a specific
 * webform on your site. Or you can leave it "webform-form.tpl.php" to affect
 * all webforms on your site.
 *
 * Available variables:
 * - $form: The complete form array.
 * - $nid: The node ID of the Webform.
 *
 * The $form array contains two main pieces:
 * - $form['submitted']: The main content of the user-created form.
 * - $form['details']: Internal information stored by Webform.
 *
 * If a preview is enabled, these keys will be available on the preview page:
 * - $form['preview_message']: The preview message renderable.
 * - $form['preview']: A renderable representing the entire submission preview.
 */
?>
<?php
  // Print out the progress bar at the top of the page.
  print drupal_render($form['progressbar']);

  // Print out the preview message if on the preview page.
  if (isset($form['preview_message'])) {
    print '<div class="messages warning">';
    print drupal_render($form['preview_message']);
    print '</div>';
  }

  // Print out the main part of the form.
  // Feel free to break this up and move the pieces within the array.

  if (drupal_get_title() == 'Lost and Found') {
    $node = node_load($nid);

    if (!drupal_page_is_cacheable() && ($user_limit_exceeded = webform_submission_user_limit_check($node))) {

      $form_error_mesage = "<div class='messages warning' >" . variable_get('submission_limit_error') . "</div>";

      print $form_error_mesage;

    }
    // If the user submit limit is not exceeded
    else {
      print drupal_render($form['submitted']);
      print drupal_render_children($form);
    }
  }
  // all forms other than lost and found
  else {
    print drupal_render($form['submitted']);
  // Always print out the entire $form. This renders the remaining pieces of the
  // form that haven't yet been rendered above (buttons, hidden elements, etc).
  print drupal_render_children($form);
  }
