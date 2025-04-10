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

import { mock, mockSingleton } from '@/testing/utils';
import { CoreSite } from '@classes/sites/site';
import { CoreUrl, CoreUrlPartNames } from '@singletons/url';
import { CorePlatform } from '@services/platform';

describe('CoreUrl singleton', () => {

    const config = { platform: 'android' };

    beforeEach(() => {
        mockSingleton(CorePlatform, [], {
            isAndroid: () => config.platform === 'android',
            isIOS: () => config.platform === 'ios',
        });
    });

    it('builds maps URL for Android platforms', () => {
        // Arrange
        const address = 'Moodle Spain HQ';
        const coordinates = { latitude: 41.914853, longitude: 1.6853498 };

        config.platform = 'android';

        // Act
        const defaultUrl = CoreUrl.buildMapsURL();
        const queryUrl = CoreUrl.buildMapsURL({ query: address });
        const coordinatesUrl = CoreUrl.buildMapsURL({ coordinates });

        // Assert
        expect(defaultUrl).toEqual('geo:');
        expect(queryUrl).toEqual('geo:0,0?q=Moodle%20Spain%20HQ');
        expect(coordinatesUrl).toEqual('geo:41.914853,1.685350');
    });

    it('builds maps URL for iOS platforms', () => {
        // Arrange
        const address = 'Moodle Spain HQ';
        const coordinates = { latitude: 41.914853, longitude: 1.6853498 };

        config.platform = 'ios';

        // Act
        const defaultUrl = CoreUrl.buildMapsURL();
        const queryUrl = CoreUrl.buildMapsURL({ query: address });
        const coordinatesUrl = CoreUrl.buildMapsURL({ coordinates });

        // Assert
        expect(defaultUrl).toEqual('http://maps.apple.com?q');
        expect(queryUrl).toEqual('http://maps.apple.com?q=Moodle%20Spain%20HQ');
        expect(coordinatesUrl).toEqual('https://maps.apple.com/?ll=41.914853,1.685350&near=41.914853,1.685350');
    });

    it('doesn\'t build maps URL if query is already a URL', () => {
        const query = 'https://moodle.org';

        const url = CoreUrl.buildMapsURL({ query });

        expect(url).toEqual(query);
    });

    it('adds www if missing', () => {
        const originalUrl = 'https://moodle.org';
        const url = CoreUrl.addOrRemoveWWW(originalUrl);

        expect(url).toEqual('https://www.moodle.org');
    });

    it('removes www if present', () => {
        const originalUrl = 'https://www.moodle.org';
        const url = CoreUrl.addOrRemoveWWW(originalUrl);

        expect(url).toEqual('https://moodle.org');
    });

    it('adds params and anchors to URLs', () => {
        // Add params to a URL without params.
        expect(CoreUrl.addParamsToUrl('https://moodle.org', {
            first: '1',
            second: '2',
        })).toEqual('https://moodle.org?first=1&second=2');

        // Add params to a URL with existing params.
        expect(CoreUrl.addParamsToUrl('https://moodle.org?existing=1', {
            first: '1',
            second: '2',
        })).toEqual('https://moodle.org?existing=1&first=1&second=2');

        // No params supplied.
        expect(CoreUrl.addParamsToUrl('https://moodle.org')).toEqual('https://moodle.org');

        // Undefined or null params aren't added.
        expect(CoreUrl.addParamsToUrl('https://moodle.org', {
            foo: undefined,
            bar: null,
            baz: 1,
        })).toEqual('https://moodle.org?baz=1');

        // Adds anchor to URL.
        expect(CoreUrl.addParamsToUrl('https://moodle.org', {
            first: '1',
            second: '2',
        }, {
            anchor: 'myanchor',
        })).toEqual('https://moodle.org?first=1&second=2#myanchor');

        // Adds params to the urltogo in case it's an auto-login URL.
        expect(CoreUrl.addParamsToUrl('https://mysite.com/autologin.php?urltogo=https%3A%2F%2Fmoodle.org', {
            first: '1',
            second: '2',
        }, {
            checkAutoLoginUrl: true,
        })).toEqual('https://mysite.com/autologin.php?urltogo=https%3A%2F%2Fmoodle.org%3Ffirst%3D1%26second%3D2');

        // Adds params to the base URL even if it has urltogo if checkAutoLoginUrl is not set.
        expect(CoreUrl.addParamsToUrl('https://mysite.com/autologin.php?urltogo=https%3A%2F%2Fmoodle.org', {
            first: '1',
            second: '2',
        })).toEqual('https://mysite.com/autologin.php?urltogo=https%3A%2F%2Fmoodle.org&first=1&second=2');
    });

    it('parses standard urls', () => {
        expect(CoreUrl.parse('https://u1:pw1@my.subdomain.com/path/?query=search#hash')).toEqual({
            protocol: 'https',
            credentials: 'u1:pw1',
            username: 'u1',
            password: 'pw1',
            domain: 'my.subdomain.com',
            path: '/path/',
            query: 'query=search',
            fragment: 'hash',
        });
    });

    it('parses domains without TLD', () => {
        expect(CoreUrl.parse('ftp://localhost/nested/path')).toEqual({
            protocol: 'ftp',
            domain: 'localhost',
            path: '/nested/path',
        });
    });

    it('parses ips', () => {
        expect(CoreUrl.parse('http://192.168.1.157:8080/')).toEqual({
            protocol: 'http',
            domain: '192.168.1.157',
            port: '8080',
            path: '/',
        });
    });

    it('assembles standard urls', () => {
        expect(CoreUrl.assemble({
            protocol: 'https',
            credentials: 'u1:pw1',
            domain: 'my.subdomain.com',
            path: '/path/',
            query: 'query=search',
            fragment: 'hash',
        })).toEqual('https://u1:pw1@my.subdomain.com/path/?query=search#hash');
    });

    it('guesses the Mooddle domain', () => {
        // Check known endpoints first.
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/my')).toEqual('school.edu/moodle');
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/?redirect=0')).toEqual('school.edu/moodle');
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/index.php')).toEqual('school.edu/moodle');
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/course/view.php')).toEqual('school.edu/moodle');
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/login/index.php')).toEqual('school.edu/moodle');
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/mod/page/view.php')).toEqual('school.edu/moodle');

        // Check an unknown endpoint.
        expect(CoreUrl.guessMoodleDomain('https://school.edu/moodle/unknown/endpoint.php')).toEqual('school.edu');
    });

    it('detects valid Moodle urls', () => {
        expect(CoreUrl.isValidMoodleUrl('https://school.edu')).toBe(true);
        expect(CoreUrl.isValidMoodleUrl('https://school.edu/path/?query=search#hash')).toBe(true);
        expect(CoreUrl.isValidMoodleUrl('//school.edu')).toBe(true);
        expect(CoreUrl.isValidMoodleUrl('school.edu')).toBe(true);
        expect(CoreUrl.isValidMoodleUrl('localhost')).toBe(true);

        expect(CoreUrl.isValidMoodleUrl('some text')).toBe(false);
    });

    it('removes protocol', () => {
        expect(CoreUrl.removeUrlParts('https://school.edu', CoreUrlPartNames.Protocol)).toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('ftp://school.edu', CoreUrlPartNames.Protocol)).toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('//school.edu', CoreUrlPartNames.Protocol)).toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('school.edu', CoreUrlPartNames.Protocol)).toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('wrong//school.edu', CoreUrlPartNames.Protocol)).toEqual('wrong//school.edu');
    });

    it('removes protocol and www', () => {
        expect(CoreUrl.removeUrlParts('https://www.school.edu', [CoreUrlPartNames.Protocol, CoreUrlPartNames.WWWInDomain]))
            .toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('ftp://school.edu', [CoreUrlPartNames.Protocol, CoreUrlPartNames.WWWInDomain]))
            .toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('www.school.edu', [CoreUrlPartNames.Protocol, CoreUrlPartNames.WWWInDomain]))
            .toEqual('school.edu');
        // Test that it works in a different order.
        expect(CoreUrl.removeUrlParts('https://www.school.edu', [CoreUrlPartNames.WWWInDomain, CoreUrlPartNames.Protocol]))
            .toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('ftp://school.edu', [CoreUrlPartNames.WWWInDomain, CoreUrlPartNames.Protocol]))
            .toEqual('school.edu');
        expect(CoreUrl.removeUrlParts('www.school.edu', [CoreUrlPartNames.WWWInDomain, CoreUrlPartNames.Protocol]))
            .toEqual('school.edu');
    });

    it('removes params', () => {
        expect(CoreUrl.removeUrlParts('https://www.school.edu?blabla#a', [CoreUrlPartNames.Query, CoreUrlPartNames.Fragment]))
            .toEqual('https://www.school.edu');
        expect(CoreUrl.removeUrlParts('ftp://school.edu?blabla=r#a', [CoreUrlPartNames.Query, CoreUrlPartNames.Fragment]))
            .toEqual('ftp://school.edu');
        expect(CoreUrl.removeUrlParts('www.school.edu?blabla=5&gg=3', [CoreUrlPartNames.Query, CoreUrlPartNames.Fragment]))
            .toEqual('www.school.edu');
    });

    it('compares domains and paths', () => {
        expect(CoreUrl.sameDomainAndPath('https://school.edu', 'https://school.edu')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu', 'HTTPS://SCHOOL.EDU')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'https://school.edu/moodle')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'https://school.edu/moodle/')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'https://school.edu/moodle#about')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'HTTPS://SCHOOL.EDU/MOODLE')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'HTTPS://SCHOOL.EDU/MOODLE/')).toBe(true);
        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'HTTPS://SCHOOL.EDU/MOODLE#ABOUT')).toBe(true);

        expect(CoreUrl.sameDomainAndPath('https://school.edu/moodle', 'https://school.edu/moodle/about')).toBe(false);
    });

    it('gets the anchor of a URL', () => {
        expect(CoreUrl.getUrlAnchor('https://school.edu#foo')).toEqual('#foo');
        expect(CoreUrl.getUrlAnchor('https://school.edu#foo#bar')).toEqual('#foo#bar');
        expect(CoreUrl.getUrlAnchor('https://school.edu')).toEqual(undefined);
    });

    it('removes the anchor of a URL', () => {
        expect(CoreUrl.removeUrlParts('https://school.edu#foo', CoreUrlPartNames.Fragment)).toEqual('https://school.edu');
        expect(CoreUrl.removeUrlParts('https://school.edu#foo#bar', CoreUrlPartNames.Fragment)).toEqual('https://school.edu');
        expect(CoreUrl.removeUrlParts('https://school.edu', CoreUrlPartNames.Fragment)).toEqual('https://school.edu');
    });

    it('gets the username from a URL', () => {
        expect(CoreUrl.getUsernameFromUrl(
            'https://username@domain.com?token=TOKEN&privatetoken=PRIVATETOKEN&redirect=http://domain.com/course/view.php?id=2',
        )).toEqual('username');
        expect(CoreUrl.getUsernameFromUrl(
            'https://username:password@domain.com?token=TOKEN&privatetoken=PRIVATETOKEN&redirect=http://domain.com/course/',
        )).toEqual('username');
        expect(CoreUrl.getUsernameFromUrl(
            'https://domain.com?token=TOKEN&privatetoken=PRIVATETOKEN&redirect=http://domain.com/course/view.php?id=2',
        )).toEqual(undefined);
    });

    it('converts to absolute URLs', () => {
        expect(CoreUrl.toAbsoluteURL('https://school.edu/foo/bar', 'https://mysite.edu')).toBe('https://mysite.edu');
        expect(CoreUrl.toAbsoluteURL('https://school.edu/foo/bar', '//mysite.edu')).toBe('https://mysite.edu');
        expect(CoreUrl.toAbsoluteURL('https://school.edu/foo/bar', '/image.png')).toBe('https://school.edu/image.png');
        expect(CoreUrl.toAbsoluteURL('https://school.edu/foo/bar', 'image.png')).toBe('https://school.edu/foo/bar/image.png');
        expect(CoreUrl.toAbsoluteURL('https://school.edu/foo.php', 'image.png')).toBe('https://school.edu/foo.php/image.png');
    });

    it('converts to relative URLs', () => {
        expect(CoreUrl.toRelativeURL('https://school.edu/foo/bar', 'https://mysite.edu')).toBe('https://mysite.edu');
        expect(CoreUrl.toRelativeURL('https://school.edu/', 'https://school.edu/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('http://school.edu/', 'https://school.edu/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu/', 'http://school.edu/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu?id=1#anchor', 'https://school.edu/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu/foo/bar', 'https://school.edu/foo/bar/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu', 'school.edu/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu/foo/bar', '/foo/bar/image.png')).toBe('image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu/foo', '/foo/bar/image.png')).toBe('bar/image.png');
        expect(CoreUrl.toRelativeURL('https://school.edu/foo', '/bar/image.png')).toBe('/bar/image.png');
    });

    it('checks if it is a Vimeo video URL', () => {
        expect(CoreUrl.isVimeoVideoUrl('')).toEqual(false);
        expect(CoreUrl.isVimeoVideoUrl('https://player.vimeo.com')).toEqual(false);
        expect(CoreUrl.isVimeoVideoUrl('https://player.vimeo.com/video/')).toEqual(false);
        expect(CoreUrl.isVimeoVideoUrl('player.vimeo.com/video/123456')).toEqual(false);
        expect(CoreUrl.isVimeoVideoUrl('https://player.vimeo.com/video/123456')).toEqual(true);
        expect(CoreUrl.isVimeoVideoUrl('http://player.vimeo.com/video/123456')).toEqual(true);
        expect(CoreUrl.isVimeoVideoUrl('https://player.vimeo.com/video/123456/654321?foo=bar')).toEqual(true);
    });

    it('gets the Vimeo player URL', () => {
        const siteUrl = 'https://mysite.com';
        const token = 'mytoken';
        const site = mock(new CoreSite('42', siteUrl, token));

        // Test basic usage.
        expect(CoreUrl.getVimeoPlayerUrl('', site)).toEqual(undefined);
        expect(CoreUrl.getVimeoPlayerUrl('https://somesite.com', site)).toEqual(undefined);
        expect(CoreUrl.getVimeoPlayerUrl('https://player.vimeo.com/video/123456', site))
            .toEqual(`${siteUrl}/media/player/vimeo/wsplayer.php?video=123456&token=${token}`);

        // Test privacy hash.
        expect(CoreUrl.getVimeoPlayerUrl('https://player.vimeo.com/video/123456?h=foo', site))
            .toEqual(`${siteUrl}/media/player/vimeo/wsplayer.php?video=123456&token=${token}&h=foo`);
        expect(CoreUrl.getVimeoPlayerUrl('https://player.vimeo.com/video/123456/foo', site))
            .toEqual(`${siteUrl}/media/player/vimeo/wsplayer.php?video=123456&token=${token}&h=foo`);
    });

    it('extracts args from pluginfile URLs', () => {
        expect(CoreUrl.getPluginFileArgs('http://mysite.com/pluginfile.php/6/mod_foo/content/14/foo.txt'))
            .toEqual(['6', 'mod_foo', 'content', '14', 'foo.txt']);
        expect(CoreUrl.getPluginFileArgs('http://mysite.com/webservice/pluginfile.php/6/mod_foo/content/14/foo.txt'))
            .toEqual(['6', 'mod_foo', 'content', '14', 'foo.txt']);
        expect(CoreUrl.getPluginFileArgs('http://mysite.com/tokenpluginfile.php/abcdef123456/6/mod_foo/content/14/foo.txt'))
        .toEqual(['6', 'mod_foo', 'content', '14', 'foo.txt']);

        // It doesn't work with other URLs, and also when pluginfile doesn't have enough params.
        expect(CoreUrl.getPluginFileArgs('http://mysite.com')).toEqual(undefined);
        expect(CoreUrl.getPluginFileArgs('http://mysite.com/pluginfile.php/6/')).toEqual(undefined);
    });

});
