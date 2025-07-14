*** Settings ***
Documentation    Tests automatisés pour application e-commerce Angular
Library          SeleniumLibrary
Library          Collections
Library          String
Library          DateTime
Test Setup       Open Browser Setup
Test Teardown    Close Browser
Suite Setup      Log    Suite de tests e-commerce démarrée
Suite Teardown   Log    Suite de tests e-commerce terminée

*** Variables ***
${BASE_URL}           http://localhost:4200
${BROWSER}            chrome
${TIMEOUT}            10s
${VALID_EMAIL}        test@example.com
${VALID_PASSWORD}     Test123!
${INVALID_EMAIL}      invalid-email
${INVALID_PASSWORD}   123

# Routes de l'application
${HOME_ROUTE}         /home
${LOGIN_ROUTE}        /login
${SIGNUP_ROUTE}       /sign-up
${ORDERS_ROUTE}       /orders

# Selectors pour l'inscription (sign-up)
${REGISTER_EMAIL_INPUT}   css:#form2Example1
${REGISTER_USERNAME_INPUT} css:#form2Example3
${REGISTER_PASSWORD_INPUT} css:#form2Example2
${REGISTER_BUTTON}        css:button[type="submit"]
${REGISTER_LINK}          css:a[routerLink="/sign-up"]

# Selectors pour la connexion (login)
${LOGIN_EMAIL_INPUT}      css:#form2Example1
${LOGIN_PASSWORD_INPUT}   css:#form2Example2
${LOGIN_BUTTON}           css:button[type="submit"]
${REMEMBER_CHECKBOX}      css:#form2Example31
${FORGOT_PASSWORD_LINK}   css:a[href="#!"]

# Messages d'erreur
${ERROR_MESSAGE}          css:.error-message

# Selectors pour les produits (à adapter selon votre HTML)
${PRODUCT_CARD}           css:.product-card
${PRODUCT_GRID}           css:.product-grid
${SEARCH_INPUT}           css:[data-testid="search-input"]
${SEARCH_BUTTON}          css:[data-testid="search-button"]
${ADD_TO_CART_BUTTON}     css:[data-testid="add-to-cart"]
${CART_ICON}              css:[data-testid="cart-icon"]
${CART_ITEM_COUNT}        css:[data-testid="cart-count"]
${CHECKOUT_BUTTON}        css:[data-testid="checkout-button"]
${PRODUCT_CARD}           css:[data-testid="product-card"]

*** Keywords ***
Open Browser Setup
    Open Browser    ${BASE_URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Timeout    ${TIMEOUT}
    Wait Until Page Contains Element    css:body

Navigate To Home Page
    Go To    ${BASE_URL}${HOME_ROUTE}
    Wait Until Page Contains Element    css:body
    Page Should Contain Element    ${PRODUCT_GRID}

Navigate To Login Page
    Go To    ${BASE_URL}${LOGIN_ROUTE}
    Wait Until Page Contains Element    ${LOGIN_EMAIL_INPUT}
    Page Should Contain    Sign in

Navigate To Register Page
    Go To    ${BASE_URL}${SIGNUP_ROUTE}
    Wait Until Page Contains Element    ${REGISTER_EMAIL_INPUT}
    Page Should Contain    Register

Login With Valid Credentials
    Navigate To Login Page
    Input Text    ${LOGIN_EMAIL_INPUT}    ${VALID_EMAIL}
    Input Text    ${LOGIN_PASSWORD_INPUT}    ${VALID_PASSWORD}
    Click Button    ${LOGIN_BUTTON}
    # Attendre la redirection vers la page d'accueil
    Wait Until Location Is    ${BASE_URL}${HOME_ROUTE}    timeout=10s

Login With Invalid Credentials
    [Arguments]    ${email}    ${password}
    Navigate To Login Page
    Input Text    ${LOGIN_EMAIL_INPUT}    ${email}
    Input Text    ${LOGIN_PASSWORD_INPUT}    ${password}
    Click Button    ${LOGIN_BUTTON}
    # Rester sur la page de login en cas d'erreur
    Wait Until Page Contains Element    ${LOGIN_EMAIL_INPUT}

Register New User
    [Arguments]    ${email}    ${username}    ${password}
    Navigate To Register Page
    Input Text    ${REGISTER_EMAIL_INPUT}    ${email}
    Input Text    ${REGISTER_USERNAME_INPUT}    ${username}
    Input Text    ${REGISTER_PASSWORD_INPUT}    ${password}
    Click Button    ${REGISTER_BUTTON}

Check User Is Logged In
    # Vérifier que l'utilisateur est connecté (à adapter selon votre navbar)
    Location Should Be    ${BASE_URL}${HOME_ROUTE}
    # Ou vérifier la présence d'un élément qui n'apparaît que quand connecté

Search For Product
    [Arguments]    ${product_name}
    Input Text    ${SEARCH_INPUT}    ${product_name}
    Click Button    ${SEARCH_BUTTON}
    Wait Until Page Contains Element    ${PRODUCT_CARD}

Add Product To Cart
    [Arguments]    ${product_index}=1
    ${product_selector}=    Set Variable    css:[data-testid="product-card"]:nth-child(${product_index}) [data-testid="add-to-cart"]
    Click Button    ${product_selector}
    Wait Until Element Is Visible    css:.toast-success    timeout=5s

Get Cart Item Count
    ${count}=    Get Text    ${CART_ITEM_COUNT}
    [Return]    ${count}

Clear Cart
    Click Element    ${CART_ICON}
    Wait Until Page Contains Element    css:[data-testid="cart-items"]
    ${items}=    Get WebElements    css:[data-testid="remove-item"]
    FOR    ${item}    IN    @{items}
        Click Element    ${item}
        Sleep    0.5s
    END

*** Test Cases ***
TC001 - Vérifier le chargement de la page d'accueil
    [Documentation]    Vérifier que la page d'accueil se charge correctement
    [Tags]    smoke    ui
    Navigate To Home Page
    Page Should Contain Element    ${PRODUCT_GRID}

TC002 - Navigation vers la page de connexion
    [Documentation]    Vérifier la navigation vers la page de connexion
    [Tags]    navigation    ui
    Navigate To Login Page
    Page Should Contain    Sign in
    Page Should Contain Element    ${LOGIN_EMAIL_INPUT}
    Page Should Contain Element    ${LOGIN_PASSWORD_INPUT}
    Page Should Contain Element    ${REMEMBER_CHECKBOX}

TC003 - Navigation vers la page d'inscription
    [Documentation]    Vérifier la navigation vers la page d'inscription
    [Tags]    navigation    ui
    Navigate To Register Page
    Page Should Contain    Register
    Page Should Contain Element    ${REGISTER_EMAIL_INPUT}
    Page Should Contain Element    ${REGISTER_USERNAME_INPUT}
    Page Should Contain Element    ${REGISTER_PASSWORD_INPUT}

TC004 - Connexion avec des identifiants valides
    [Documentation]    Tester la connexion avec des identifiants valides
    [Tags]    authentication    critical
    Login With Valid Credentials
    Check User Is Logged In

TC005 - Connexion avec email invalide
    [Documentation]    Tester la connexion avec un email invalide
    [Tags]    authentication    negative
    Login With Invalid Credentials    ${INVALID_EMAIL}    ${VALID_PASSWORD}
    Page Should Contain Element    ${ERROR_MESSAGE}

TC006 - Connexion avec mot de passe invalide
    [Documentation]    Tester la connexion avec un mot de passe invalide
    [Tags]    authentication    negative
    Login With Invalid Credentials    ${VALID_EMAIL}    ${INVALID_PASSWORD}
    Page Should Contain Element    ${ERROR_MESSAGE}

TC007 - Inscription avec des données valides
    [Documentation]    Tester l'inscription avec des données valides
    [Tags]    registration    critical
    ${timestamp}=    Get Current Date    result_format=%s
    ${unique_email}=    Set Variable    test${timestamp}@example.com
    Register New User    ${unique_email}    testuser${timestamp}    Test123!
    # Vérifier le succès de l'inscription (redirection ou message)
    Page Should Not Contain Element    ${ERROR_MESSAGE}

TC008 - Inscription avec email invalide
    [Documentation]    Tester l'inscription avec un email invalide
    [Tags]    registration    negative
    Register New User    invalid-email    testuser    Test123!
    # Vérifier l'affichage d'une erreur
    Wait Until Page Contains Element    ${ERROR_MESSAGE}    timeout=5s

TC009 - Lien vers inscription depuis la page de connexion
    [Documentation]    Tester le lien vers l'inscription depuis la page de connexion
    [Tags]    navigation    ui
    Navigate To Login Page
    Click Link    ${REGISTER_LINK}
    Wait Until Location Is    ${BASE_URL}${SIGNUP_ROUTE}
    Page Should Contain    Register

TC010 - Checkbox "Remember me" fonctionnel
    [Documentation]    Tester que la checkbox Remember me fonctionne
    [Tags]    ui    functional
    Navigate To Login Page
    # Vérifier que la checkbox est cochée par défaut
    Checkbox Should Be Selected    ${REMEMBER_CHECKBOX}
    # Décocher et recocher
    Unselect Checkbox    ${REMEMBER_CHECKBOX}
    Checkbox Should Not Be Selected    ${REMEMBER_CHECKBOX}
    Select Checkbox    ${REMEMBER_CHECKBOX}
    Checkbox Should Be Selected    ${REMEMBER_CHECKBOX}

TC011 - Processus de commande complet (utilisateur connecté)
    [Documentation]    Tester le processus de commande de bout en bout
    [Tags]    checkout    critical    e2e
    Login With Valid Credentials
    Search For Product    smartphone
    Add Product To Cart    1
    Click Element    ${CART_ICON}
    Click Button    ${CHECKOUT_BUTTON}

    # Remplir les informations de livraison
    Input Text    css:[data-testid="shipping-address"]    123 Rue de la Paix
    Input Text    css:[data-testid="shipping-city"]    Paris
    Input Text    css:[data-testid="shipping-postal"]    75001

    # Continuer vers le paiement
    Click Button    css:[data-testid="continue-payment"]

    # Simuler le paiement
    Input Text    css:[data-testid="card-number"]    4111111111111111
    Input Text    css:[data-testid="card-expiry"]    12/25
    Input Text    css:[data-testid="card-cvv"]    123

    Click Button    css:[data-testid="place-order"]
    Wait Until Page Contains    Commande confirmée
    Page Should Contain    Numéro de commande

TC012 - Tentative de commande sans être connecté
    [Documentation]    Vérifier la redirection vers la page de connexion
    [Tags]    checkout    security
    Search For Product    smartphone
    Add Product To Cart    1
    Click Element    ${CART_ICON}
    Click Button    ${CHECKOUT_BUTTON}
    Wait Until Page Contains Element    ${LOGIN_EMAIL_INPUT}
    Page Should Contain    Connectez-vous pour continuer

TC013 - Filtrage des produits par catégorie
    [Documentation]    Tester le filtrage des produits par catégorie
    [Tags]    filter    functional
    Click Element    css:[data-testid="category-electronics"]
    Wait Until Page Contains Element    ${PRODUCT_CARD}
    Page Should Contain    Électronique

    # Vérifier qu'au moins un produit est affiché
    ${product_count}=    Get Element Count    ${PRODUCT_CARD}
    Should Be True    ${product_count} > 0

TC014 - Tri des produits par prix
    [Documentation]    Tester le tri des produits par prix
    [Tags]    sort    functional
    Search For Product    smartphone
    Select From List By Value    css:[data-testid="sort-select"]    price-asc

    # Vérifier que les produits sont triés par prix croissant
    ${prices}=    Get WebElements    css:[data-testid="product-price"]
    ${first_price}=    Get Text    ${prices}[0]
    ${second_price}=    Get Text    ${prices}[1]
    # Logique de comparaison des prix (à adapter selon votre format)

TC015 - Pagination des résultats
    [Documentation]    Tester la pagination des résultats de recherche
    [Tags]    pagination    functional
    Search For Product    smartphone

    # Vérifier la présence de la pagination si nécessaire
    Run Keyword If    Element Should Be Visible    css:[data-testid="pagination"]
    ...    Click Element    css:[data-testid="next-page"]
    ...    AND    Wait Until Page Contains Element    ${PRODUCT_CARD}

TC016 - Responsive design - Version mobile
    [Documentation]    Tester l'affichage sur mobile
    [Tags]    responsive    ui
    Set Window Size    375    667    # iPhone SE
    Page Should Contain Element    css:[data-testid="mobile-menu"]
    Page Should Contain Element    ${SEARCH_INPUT}

TC017 - Gestion des erreurs réseau
    [Documentation]    Tester la gestion des erreurs de connexion
    [Tags]    error    network
    # Simuler une erreur réseau (nécessite une configuration spéciale)
    Go To    ${BASE_URL}/api/products/999999
    Page Should Contain    Erreur de chargement
    Page Should Contain    Veuillez réessayer

TC018 - Déconnexion utilisateur
    [Documentation]    Tester la déconnexion de l'utilisateur
    [Tags]    authentication    functional
    Login With Valid Credentials
    Click Button    ${LOGOUT_BUTTON}
    Wait Until Page Contains Element    ${LOGIN_BUTTON}
    Page Should Not Contain    Tableau de bord

TC019 - Validation des champs obligatoires au checkout
    [Documentation]    Tester la validation des champs obligatoires
    [Tags]    validation    checkout
    Login With Valid Credentials
    Search For Product    smartphone
    Add Product To Cart    1
    Click Element    ${CART_ICON}
    Click Button    ${CHECKOUT_BUTTON}

    # Essayer de continuer sans remplir les champs obligatoires
    Click Button    css:[data-testid="continue-payment"]
    Page Should Contain    Veuillez remplir tous les champs obligatoires

TC020 - Performance - Temps de chargement de la page
    [Documentation]    Vérifier que la page se charge dans un délai acceptable
    [Tags]    performance    non-functional
    ${start_time}=    Get Current Date    result_format=%s
    Go To    ${BASE_URL}
    Wait Until Page Contains Element    css:body
    ${end_time}=    Get Current Date    result_format=%s
    ${load_time}=    Evaluate    ${end_time} - ${start_time}
    Should Be True    ${load_time} < 5    Page should load in less than 5 seconds
