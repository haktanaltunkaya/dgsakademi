// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Type } from '@angular/core';

import { AddonModAssignDefaultFeedbackHandler } from '@addons/mod/assign/services/handlers/default-feedback';
import { AddonModAssignPlugin } from '@addons/mod/assign/services/assign';
import { Translate } from '@singletons';
import type{ IAddonModAssignFeedbackPluginComponent } from '@addons/mod/assign/classes/base-feedback-plugin-component';

/**
 * Handler to display an assign feedback site plugin.
 */
export class CoreSitePluginsAssignFeedbackHandler extends AddonModAssignDefaultFeedbackHandler {

    constructor(public name: string, public type: string, protected prefix: string) {
        super();
    }

    /**
     * @inheritdoc
     */
    async getComponent(): Promise<Type<IAddonModAssignFeedbackPluginComponent>> {
        const { CoreSitePluginsAssignFeedbackComponent } =
            await import('@features/siteplugins/components/assign-feedback/assign-feedback');

        return CoreSitePluginsAssignFeedbackComponent;
    }

    /**
     * @inheritdoc
     */
    getPluginName(plugin: AddonModAssignPlugin): string {
        // Check if there's a translated string for the plugin.
        const translationId = `${this.prefix}pluginname`;
        const translation = Translate.instant(translationId);

        if (translationId != translation) {
            // Translation found, use it.
            return translation;
        }

        // Fallback to WS string.
        return plugin.name;
    }

}
