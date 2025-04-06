@addon_block_calendar_month @app @block @block_calendar_month @javascript
Feature: View the calendar block and check it links to the calendar page

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email | idnumber |
      | student1 | Student | 1 | student1@example.com | S1 |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1 | 0 |
    And the following "course enrolments" exist:
      | user | course | role |
      | student1 | C1 | student |
    And the following "blocks" exist:
      | blockname      | contextlevel | reference | pagetypepattern | defaultregion |
      | calendar_month | Course       | C1        | course-view-*   | side-pre      |

  Scenario: View and navigate the calendar block in a course
    Given I entered the course "Course 1" as "student1" in the app
    When I press "Open block drawer" in the app
    Then I should find "Calendar" in the app
    When I press "Calendar" in the app
    Then the header should be "Calendar" in the app
