Feature: Authentication and protected access
  As an API consumer
  I want to validate the main authentication flows
  So that application behavior remains stable

  Scenario: Successful registration
    Given I have valid registration data
    When I send a registration request
    Then registration should succeed

  Scenario: Login with invalid credentials
    Given there is a registered user
    When I try to authenticate with an invalid password
    Then authentication should fail with invalid credentials

  Scenario: Access denied without token
    When I access the protected route without a token
    Then access should be denied