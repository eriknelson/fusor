import Ember from 'ember';
import TextFieldComponent from './text-f';

////////////////////////////////////////////////////////////////////////////////
// NOTE: This is a stopgap solution designed to be easily reversed once
// deployment names are capable of accepting spaces.
////////////////////////////////////////////////////////////////////////////////

export default TextFieldComponent.extend({
  hasError: Ember.computed(
    'showValidationError',
    'errors.name',
    'doesntMatchPassword',
    'passwordTooShort',
    'validIsRequiredAndBlank',
    'validIsUnique',
    'invalidIsAlphaNumeric',
    'invalidIsHostname',
    'invalidNetworkRange',
    'invalidCIDRNotation',
    'invalidDeploymentName',
    function() {
      return (this.get('showValidationError') &&
               (Ember.isPresent(this.get('errors.name')) ||
               this.get('doesntMatchPassword') ||
               this.get('passwordTooShort') ||
               this.get('validIsRequiredAndBlank') ||
               this.get('validIsUnique') ||
               this.get('invalidIsAlphaNumeric') ||
               this.get('invalidIsHostname') ||
               this.get('invalidNetworkRange') ||
               this.get('invalidDeploymentName')) ||
               this.get('invalidCIDRNotation'));
    }
  ),
  invalidDeploymentName: Ember.computed('value', function() {
    let val = this.get('value');
    let isInvalid = !(Ember.isPresent(val) && validateDeplName(val));
    console.log('this.el: ', this.$());
    if(this.$()) {
      let $fg = this.$().find('.form-group');

      try {
        if(isInvalid) {
          $fg.addClass('has-error');
        } else if($fg.hasClass('has-error')){
          $fg.removeClass('has-error')
        }
      } catch(err) {
        console.log('got error: ', err);
      }
    }

    this.set('isInvalidDeploymentName', isInvalid);
    return isInvalid;
  }),
});

function validateDeplName(name) {
  // Reject anything containing a space, including prefix/suffix
  return !/\s/.test(name)
}
