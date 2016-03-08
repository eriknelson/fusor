import Ember from 'ember';
import request from 'ic-ajax';
import ProgressBarMixin from "../../../mixins/progress-bar-mixin";
import NeedsDeploymentMixin from "../../../mixins/needs-deployment-mixin";

export default Ember.Controller.extend(ProgressBarMixin, NeedsDeploymentMixin, {

  isRhev: Ember.computed.alias("deploymentController.isRhev"),
  isOpenStack: Ember.computed.alias("deploymentController.isOpenStack"),
  isCloudForms: Ember.computed.alias("deploymentController.isCloudForms"),

  nameRHCI: Ember.computed.alias("deploymentController.nameRHCI"),
  nameRhev: Ember.computed.alias("deploymentController.nameRhev"),
  nameOpenStack: Ember.computed.alias("deploymentController.nameOpenStack"),
  nameCloudForms: Ember.computed.alias("deploymentController.nameCloudForms"),
  nameSatellite: Ember.computed.alias("deploymentController.nameSatellite"),
  progressDeployment: Ember.computed.alias("deployTask.progress"),
  resultDeployment: Ember.computed.alias("deployTask.result"),
  stateDeployment: Ember.computed.alias("deployTask.state"),

  deployTaskIsStopped: Ember.computed('stateDeployment', function() {
    return ((this.get('stateDeployment') === 'stopped') || (this.get('stateDeployment') === 'paused'));
  }),

  deployTaskIsFinished: Ember.computed('progressDeployment', 'resultDeployment', function() {
    return ((this.get('progressDeployment') === '1') && (this.get('resultDeployment') === 'success'));
  }),

  //Deploy task is not 100% but All subtasks are 100%
  showDeployTaskProgressBar: Ember.computed('isRhev',
                                            'isOpenStack',
                                            'isCloudForms',
                                            'manageContentTask.progress',
                                            'rhevTask.progress',
                                            'openstackTask.progress',
                                            'cfmeTask.progress',
                                            'progressDeployment',
                                            function() {
    if (this.get('progressDeployment') === '1' || this.get('manageContentTask.progress') !== '1') {
      return false;
    }

    if (this.get('isRhev') && this.get('rhevTask.progress') !== '1') {
      return false;
    }

    if (this.get('isOpenStack') && this.get('openstackTask.progress') !== '1') {
      return false;
    }

    if (this.get('isCloudForms') && this.get('cfmeTask.progress') !== '1') {
      return false;
    }

    return true;
  }),

  isAbandonModalOpen: false,

  actions: {
    redeploy() {
      // TODO: Throw up spinner!
      console.log('actions::redeploy');

      //////////////////////////////////////////////////////////////
      // NOTE: Not clear how this is satisfied? Seems to be undefined all over
      //  -> additional header
      //"Authorization": "Basic " + this.get('session.basicAuthToken')
      //////////////////////////////////////////////////////////////
      let depl = this.get('deploymentController.model');
      let token = Ember.$('meta[name="csrf-token"]').attr('content');

      console.log('requesting redeployment...');
      request({
        url: '/fusor/api/v21/deployments/' + depl.get('id') + '/redeploy',
        type: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
          "Authorization": "Basic " + this.get('session.basicAuthToken')
        }
      }).then((response) => {
        let newTaskUUID = response.id;
        console.log('/redeploy then branch');
        console.log('got redeploy task uuid: ', newTaskUUID);

        // Relink deployment object with new deployment task and transition
        // back to review.progress.overview as if this was just a regular
        // deployment initiated from the review page.
        // TODO: Anything else required here aside from just updating the FK?
        depl.set('foreman_task_uuid', newTaskUUID);
        depl.set('has_content_error', false);
        depl.save();

        this.transitionToRoute('review.progress.overview');
      }).catch((err) => {
        console.log('ERROR occurred attempting a redeploy', err);
      });
    },
    abandon() {
      this.set('isAbandonModalOpen', true);
    },
    executeAbandonment() {
      let depl = this.get('deploymentController.model');
      depl.destroyRecord();
      this.transitionToRoute('deployments');
    }
  }
});
