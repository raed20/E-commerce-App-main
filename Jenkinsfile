pipeline {
    agent any

    environment {
        // Ajout des variables pour AKS deployment
        AZURE_CREDENTIALS = 'azure-service-principal-id'
        RESOURCE_GROUP = 'shopfer'
        AKS_CLUSTER_NAME = 'shopfer'
        NAMESPACE = 'default'
        DEPLOYMENT_NAME = 'shopfer-app'
    }

    stages {
        stage('Clone repository') {
            steps {
                git branch: 'main', url: 'https://github.com/raed20/E-commerce-App-main'
            }
        }

        stage('Install dependencies') {
            steps {
                bat 'call npm install'
            }
        }

        stage('Run unit tests') {
            steps {
                bat 'call npm run test -- --karma-config karma.conf.js --watch=false --code-coverage'
            }
        }

        stage('Build Angular Application') {
            steps {
                bat 'call npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t shopferimgg .'
            }
        }

        stage('Push Docker Image to ACR') {
            steps {
                bat """
                    az acr login --name shopfer
                    docker tag shopferimgg shopfer.azurecr.io/shopferimgg:latest
                    docker tag shopferimgg shopfer.azurecr.io/shopferimgg:${BUILD_NUMBER}
                    docker push shopfer.azurecr.io/shopferimgg:latest
                    docker push shopfer.azurecr.io/shopferimgg:${BUILD_NUMBER}
                """
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    try {
                        bat '''
                            docker stop shopfer-container 2>nul || echo off
                            docker rm shopfer-container 2>nul || echo off
                        '''
                    } catch (Exception e) {
                        // Container cleanup failed - continue
                    }
                }

                bat 'docker run -d --name shopfer-container -p 4200:4200 shopferimgg'
            }
        }

        stage('Verify Application Status') {
            steps {
                script {
                    def maxAttempts = 30
                    def attempt = 0
                    def appStarted = false

                    while (attempt < maxAttempts && !appStarted) {
                        try {
                            sleep(2)
                            bat 'netstat -an | find "4200" | find "LISTENING"'
                            appStarted = true
                        } catch (Exception e) {
                            attempt++
                            if (attempt % 10 == 0) {
                                echo "Waiting for application... (${attempt}/${maxAttempts})"
                            }
                        }
                    }

                    if (!appStarted) {
                        error("Application failed to start within timeout")
                    }
                }
            }
        }

        stage('Setup Robot Framework Environment') {
            steps {
                bat '''
                    if not exist robot-tests mkdir robot-tests
                    cd robot-tests
                    if exist robot_env rmdir /s /q robot_env
                    python -m venv robot_env
                    robot_env\\Scripts\\python.exe -m pip install --upgrade pip --quiet
                    robot_env\\Scripts\\pip install robotframework robotframework-seleniumlibrary selenium webdriver-manager --quiet
                '''
            }
        }

        stage('Run Robot Framework tests') {
            steps {
                bat '''
                    cd robot-tests
                    robot_env\\Scripts\\robot --outputdir . ^
                                              --variable BROWSER:headlesschrome ^
                                              --variable URL:http://localhost:4200 ^
                                              --loglevel INFO ^
                                              hello.robot
                '''
            }
        }

        // ===== NOUVELLES ÉTAPES DE DÉPLOIEMENT AKS =====
        stage('Deploy to AKS') {
            steps {
                withCredentials([azureServicePrincipal(AZURE_CREDENTIALS)]) {
                    script {
                        echo "🚀 Starting deployment to AKS..."

                        bat '''
                            az login --service-principal -u %AZURE_CLIENT_ID% -p %AZURE_CLIENT_SECRET% -t %AZURE_TENANT_ID%
                            az account set --subscription %AZURE_SUBSCRIPTION_ID%
                        '''

                        // Get AKS credentials
                        bat "az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --overwrite-existing"

                        // Update deployment with new image
                        bat """
                            kubectl set image deployment/${DEPLOYMENT_NAME} shopfer-container=shopfer.azurecr.io/shopferimgg:${BUILD_NUMBER} -n ${NAMESPACE}
                            kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=600s
                        """
                    }
                }
            }
        }

        stage('Verify AKS Deployment') {
            steps {
                bat '''
                    echo === AKS Deployment Status ===
                    kubectl get pods -n default
                    kubectl get services -n default
                    kubectl describe deployment/shopfer-app -n default

                    echo === Getting Application URL ===
                    for /f "tokens=*" %%i in ('kubectl get service shopfer-service -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2^>nul') do set EXTERNAL_IP=%%i
                    if defined EXTERNAL_IP (
                        echo Application accessible at: http://%EXTERNAL_IP%
                    ) else (
                        echo External IP not yet assigned, checking service details...
                        kubectl get service shopfer-service -o wide
                    )
                '''
            }
        }
    }

    post {
        always {
            script {
                // Container cleanup
                try {
                    bat '''
                        docker stop shopfer-container 2>nul || echo off
                        docker rm shopfer-container 2>nul || echo off
                        for /F %%i in ('docker ps -q --filter "ancestor=shopferimgg" 2^>nul') do (
                            docker stop %%i 2^>nul && docker rm %%i 2^>nul
                        )
                    '''
                } catch (Exception e) {
                    // Cleanup failed - continue
                }

                // Process cleanup
                try {
                    bat '''
                        for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":4200" ^| find "LISTENING"') do (
                            taskkill /f /pid %%a 2^>nul || echo off
                        )
                    '''
                } catch (Exception e) {
                    // Process cleanup failed - continue
                }

                // Publish Robot Framework results
                try {
                    if (fileExists('robot-tests/output.xml')) {
                        robot(
                            outputPath: 'robot-tests',
                            outputFileName: 'output.xml',
                            reportFileName: 'report.html',
                            logFileName: 'log.html',
                            disableArchiveOutput: false,
                            passThreshold: 80,
                            unstableThreshold: 60,
                            otherFiles: '*.png,*.jpg'
                        )
                    }
                } catch (Exception e) {
                    echo "Warning: Could not publish Robot Framework results"
                }

                // Archive artifacts
                try {
                    if (fileExists('robot-tests')) {
                        archiveArtifacts artifacts: 'robot-tests/**/*.{xml,html,log,png,jpg}', allowEmptyArchive: true, fingerprint: true
                    }
                } catch (Exception e) {
                    echo "Warning: Could not archive artifacts"
                }
            }
        }

        success {
            echo 'Pipeline completed successfully ✅'
            echo '🎉 Application deployed to AKS and tests passed!'
        }

        failure {
            echo 'Pipeline failed ❌'

            // Minimal diagnostic on failure
            script {
                try {
                    bat '''
                        echo === DIAGNOSTIC ===
                        docker ps -a | find "shopfer" 2>nul || echo No shopfer containers
                        netstat -an | find "4200" 2>nul || echo Port 4200 not found
                        if exist robot-tests\\output.xml echo Robot test results available

                        echo === AKS Diagnostic ===
                        kubectl get pods -n default 2>nul || echo Kubectl not available
                        kubectl get events --sort-by='.lastTimestamp' -n default 2>nul || echo Cannot get events
                    '''
                } catch (Exception e) {
                    // Diagnostic failed - continue
                }
            }
        }
    }
}
// ===== À AJOUTER dans la section environment de votre pipeline =====
environment {
    // Vos variables existantes restent

    // Nouvelles variables pour AKS
    AZURE_CREDENTIALS = 'azure-service-principal-id'
    RESOURCE_GROUP = 'shopfer'
    AKS_CLUSTER_NAME = 'shopfer'
    NAMESPACE = 'default'
    DEPLOYMENT_NAME = 'shopfer-app'
}

// ===== À AJOUTER après votre stage 'Run Robot Framework tests' =====

        stage('Deploy to AKS') {
            steps {
                withCredentials([azureServicePrincipal(AZURE_CREDENTIALS)]) {
                    script {
                        echo "🚀 Starting deployment to AKS..."

                        bat '''
                            az login --service-principal -u %AZURE_CLIENT_ID% -p %AZURE_CLIENT_SECRET% -t %AZURE_TENANT_ID%
                            az account set --subscription %AZURE_SUBSCRIPTION_ID%
                        '''

                        // Get AKS credentials
                        bat "az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --overwrite-existing"

                        // Update deployment with new image
                        bat """
                            kubectl set image deployment/${DEPLOYMENT_NAME} shopfer-container=shopfer.azurecr.io/shopferimgg:${BUILD_NUMBER} -n ${NAMESPACE}
                            kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=600s
                        """
                    }
                }
            }
        }

        stage('Verify AKS Deployment') {
            steps {
                bat '''
                    echo === AKS Deployment Status ===
                    kubectl get pods -n default
                    kubectl get services -n default

                    echo === Getting Application URL ===
                    for /f "tokens=*" %%i in ('kubectl get service shopfer-service -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2^>nul') do set EXTERNAL_IP=%%i
                    if defined EXTERNAL_IP (
                        echo Application accessible at: http://%EXTERNAL_IP%
                    ) else (
                        echo External IP not yet assigned, checking service details...
                        kubectl get service shopfer-service -o wide
                    )
                '''
            }
        }

// ===== À AJOUTER dans la section post → failure de votre pipeline =====

                        echo === AKS Diagnostic ===
                        kubectl get pods -n default 2>nul || echo Kubectl not available
                        kubectl get events --sort-by='.lastTimestamp' -n default 2>nul || echo Cannot get events
