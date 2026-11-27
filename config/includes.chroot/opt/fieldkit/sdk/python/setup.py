from setuptools import find_packages, setup

setup(
    name="fieldkit-sdk",
    version="2.0.0",
    description="Python SDK, CLI, and MCP Runtime Engine for the FieldKit Physical AI Operating Framework",
    author="Neal Frazier Tech (@1nc0gn30)",
    author_email="dev@nullai.tech",
    url="https://github.com/NullAITech/fieldkit",
    license="MIT",
    packages=find_packages(),
    install_requires=[
        "pyyaml>=6.0",
        "cryptography>=42.0.0",
    ],
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: System :: Hardware",
    ],
    python_requires=">=3.9",
)
