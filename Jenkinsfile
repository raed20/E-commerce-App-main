pipeline {
    agent any

    // GitHub trigger configuration
    triggers {
        githubPush()  // Trigger on push events
        pollSCM('H/5 * * * *')  // UNCOMMENTED: Fallback polling every 5 minutes
    }

    // Build parameters for flexibility
    parameters {
        choice(
            name: 'BRANCH',
            choices: ['main', 'develop', 'staging'],
            description: 'Branch to build'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip unit and robot tests'
        )
        booleanParam(
            name: 'DEPLOY_TO_AKS',
            defaultValue: true,
            description: 'Deploy to AKS after successful build'
        )
    }

    environment {
        // Existing variables
        AZURE_CREDENTIALS = 'azure-service-principal-id'
        RESOURCE_GROUP = 'shopfer'
        AKS_CLUSTER_NAME = 'shopfer'
        NAMESPACE = 'default'
        DEPLOYMENT_NAME = 'shopfer-app'

        // GitHub credentials for secure access
        GITHUB_CREDENTIALS = 'github-credentials'

        // Build information
        BUILD_BRANCH = "${params.BRANCH ?: env.BRANCH_NAME ?: 'main'}"
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}-${BUILD_BRANCH}"
    }

    stages {
        // Enhanced repository cloning with credentials
        stage('Clone repository') {
            steps {
                script {
                    echo "🔄 Cloning repository from branch: ${BUILD_BRANCH}"
                    echo "🔗 Triggered by: ${env.BUILD_CAUSE ?: 'Manual'}"
                }

                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${BUILD_BRANCH}"]],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [],
                    submoduleCfg: [],
                    userRemoteConfigs: [[
                        credentialsId: "${GITHUB_CREDENTIALS}",
                        url: 'https://github.com/raed20/E-commerce-App-main.git'
                    ]]
                ])

                // Display commit information
                script {
                    def commitHash = bat(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    def commitMessage = bat(returnStdout: true, script: 'git log -1 --pretty=format:"%%s"').trim()
                    def commitAuthor = bat(returnStdout: true, script: 'git log -1 --pretty=format:"%%an"').trim()

                    echo "📝 Commit: ${commitHash}"
                    echo "💬 Message: ${commitMessage}"
                    echo "👤 Author: ${commitAuthor}"
                }
            }
        }

        stage('Install dependencies') {
            steps {
                bat 'call npm install'
            }
        }

        // Conditional test execution
        stage('Run unit tests') {
            when {
                not { params.SKIP_TESTS }
            }
            steps {
                bat 'call npm run test -- --karma-config karma.conf.js --watch=false --code-coverage'
            }
        }

        stage('Build Angular Application') {
            steps {
                bat 'call npm run build'
            }
        }

        // Enhanced Docker image building with better tagging
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🐳 Building Docker image with tag: ${DOCKER_IMAGE_TAG}"
                }
                bat "docker build -t shopferimgg:${DOCKER_IMAGE_TAG} ."
                bat "docker tag shopferimgg:${DOCKER_IMAGE_TAG} shopferimgg:latest"
            }
        }

        // Enhanced ACR push with multiple tags
        stage('Push Docker Image to ACR') {
            steps {
                bat """
                    az acr login --name shopfer
                    docker tag shopferimgg:${DOCKER_IMAGE_TAG} shopfer.azurecr.io/shopferimgg:${DOCKER_IMAGE_TAG}
                    docker tag shopferimgg:${DOCKER_IMAGE_TAG} shopfer.azurecr.io/shopferimgg:latest
                    docker tag shopferimgg:${DOCKER_IMAGE_TAG} shopfer.azurecr.io/shopferimgg:${BUILD_BRANCH}-latest

                    docker push shopfer.azurecr.io/shopferimgg:${DOCKER_IMAGE_TAG}
                    docker push shopfer.azurecr.io/shopferimgg:latest
                    docker push shopfer.azurecr.io/shopferimgg:${BUILD_BRANCH}-latest
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

                bat "docker run -d --name shopfer-container -p 4200:4200 shopferimgg:${DOCKER_IMAGE_TAG}"
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
            when {
                not { params.SKIP_TESTS }
            }
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
            when {
                not { params.SKIP_TESTS }
            }
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

        // Conditional AKS deployment
        stage('Deploy to AKS') {
            when {
                allOf {
                    params.DEPLOY_TO_AKS
                    anyOf {
                        branch 'main'
                        branch 'develop'
                        expression { params.BRANCH == 'main' || params.BRANCH == 'develop' }
                    }
                }
            }
            steps {
                withCredentials([azureServicePrincipal(AZURE_CREDENTIALS)]) {
                    script {
                        echo "🚀 Starting deployment to AKS..."
                        echo "📦 Deploying image: shopfer.azurecr.io/shopferimgg:${DOCKER_IMAGE_TAG}"

                        bat '''
                            az login --service-principal -u %AZURE_CLIENT_ID% -p %AZURE_CLIENT_SECRET% -t %AZURE_TENANT_ID%
                            az account set --subscription %AZURE_SUBSCRIPTION_ID%
                        '''

                        // Get AKS credentials
                        bat "az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --overwrite-existing"

                        // Update deployment with new image
                        bat """
                            kubectl set image deployment/${DEPLOYMENT_NAME} shopfer-container=shopfer.azurecr.io/shopferimgg:${DOCKER_IMAGE_TAG} -n ${NAMESPACE}
                            kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=600s
                        """
                    }
                }
            }
        }

        stage('Verify AKS Deployment') {
            when {
                allOf {
                    params.DEPLOY_TO_AKS
                    anyOf {
                        branch 'main'
                        branch 'develop'
                        expression { params.BRANCH == 'main' || params.BRANCH == 'develop' }
                    }
                }
            }
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

            // Optional notification
            script {
                if (env.BUILD_CAUSE?.contains('SCMTRIGGER')) {
                    echo "🔔 Build triggered by GitHub push"
                }
            }
        }

        failure {
            echo 'Pipeline failed ❌'
            echo "🔥 Build failed for branch: ${BUILD_BRANCH}"

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
                    echo "Diagnostic commands failed - continuing..."
                }
            }
        }
    }
}
